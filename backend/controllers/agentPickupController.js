const Pickup = require('../models/Pickup');
const Agent = require('../models/Agent');
const Notification = require('../models/Notification');
const Message = require('../models/Message');

// @desc    Get all available pickups for agents to claim
// @route   GET /api/pickups/available
// @access  Private (agents only)
exports.getAvailablePickups = async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = 'createdAt', location } = req.query;

    let query = { status: 'scheduled' };

    // Filter by location if provided
    if (location) {
      query['pickupAddress.city'] = location;
    }

    const pickups = await Pickup.find(query)
      .populate('userId', 'name email phone address')
      .sort({ [sortBy]: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Pickup.countDocuments(query);

    res.status(200).json({
      success: true,
      count: pickups.length,
      total,
      pages: Math.ceil(total / limit),
      pickups
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Claim a pickup (agent claims a pickup)
// @route   POST /api/pickups/:id/claim
// @access  Private (agents only)
exports.claimPickup = async (req, res) => {
  try {
    const pickupId = req.params.id;
    const userId = req.user.id;

    // Get or create the agent
    let agent = await Agent.findOne({ userId });
    if (!agent && req.user.role === 'agent') {
      agent = await Agent.create({
        userId: req.user._id,
        vehicleType: 'truck',
        vehicleNumber: 'PENDING',
        licenseNumber: 'PENDING',
        status: 'offline',
        isVerified: false
      });
    }
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent profile not found. Please complete your agent profile.'
      });
    }

    // Find the pickup
    let pickup = await Pickup.findById(pickupId).populate('userId', 'name email phone');
    if (!pickup) {
      return res.status(404).json({
        success: false,
        message: 'Pickup not found'
      });
    }

    // Idempotent behavior: if the same agent already claimed it, return success.
    if (
      pickup.agentId &&
      pickup.agentId.toString() === agent._id.toString() &&
      pickup.status === 'assigned'
    ) {
      return res.status(200).json({
        success: true,
        message: 'Pickup already claimed by you',
        pickup
      });
    }

    // Prevent double-booking using a conditional atomic update.
    const updatedPickup = await Pickup.findOneAndUpdate(
      {
        _id: pickupId,
        status: 'scheduled',
        $or: [{ agentId: null }, { agentId: { $exists: false } }]
      },
      {
        $set: {
          agentId: agent._id,
          status: 'assigned',
          claimedAt: new Date()
        },
        $addToSet: { interestedAgents: agent._id }
      },
      {
        new: true,
        runValidators: true
      }
    ).populate('userId', 'name email phone').populate('agentId', 'name phone vehicleNumber');

    // If update did not happen, the pickup was claimed/updated by someone else.
    if (!updatedPickup) {
      const latestPickup = await Pickup.findById(pickupId).select('status agentId');
      if (!latestPickup) {
        return res.status(404).json({
          success: false,
          message: 'Pickup not found'
        });
      }

      if (
        latestPickup.agentId &&
        latestPickup.agentId.toString() === agent._id.toString() &&
        latestPickup.status === 'assigned'
      ) {
        const alreadyClaimedPickup = await Pickup.findById(pickupId)
          .populate('userId', 'name email phone')
          .populate('agentId', 'name phone vehicleNumber');

        return res.status(200).json({
          success: true,
          message: 'Pickup already claimed by you',
          pickup: alreadyClaimedPickup
        });
      }

      return res.status(409).json({
        success: false,
        message: 'Another agent claimed this pickup. Please try another pickup.'
      });
    }

    // Create notification for user
    await Notification.create({
      userId: pickup.userId._id,
      type: 'pickup_assigned',
      title: 'Pickup Assigned',
      message: `Your waste pickup has been claimed by ${req.user.name || 'An agent'}`,
      relatedPickup: pickup._id,
      relatedAgent: agent._id
    });

    // Emit socket events for real-time updates
    const io = req.app.get('io');

    // Notify the user about the assignment
    io.to(pickup.userId._id.toString()).emit('pickup-assigned', {
      pickupId: pickup._id,
      agentName: req.user.name || 'Agent',
      agentPhone: req.user.phone || ''
    });

    // Broadcast to all agents that this pickup is no longer available
    io.emit('pickup-claimed', {
      pickupId: pickup._id,
      claimedBy: agent._id
    });

    res.status(200).json({
      success: true,
      message: 'Pickup claimed successfully!',
      pickup: updatedPickup
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Release a claimed pickup (agent unclaims)
// @route   POST /api/pickups/:id/release
// @access  Private (agent only - the one who claimed it)
exports.releasePickup = async (req, res) => {
  try {
    const pickupId = req.params.id;
    const userId = req.user.id;

    // Get or create the agent
    let agent = await Agent.findOne({ userId });
    if (!agent && req.user.role === 'agent') {
      agent = await Agent.create({
        userId: req.user._id,
        vehicleType: 'truck',
        vehicleNumber: 'PENDING',
        licenseNumber: 'PENDING',
        status: 'offline',
        isVerified: false
      });
    }
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent profile not found'
      });
    }

    // Find the pickup
    const pickup = await Pickup.findById(pickupId);
    if (!pickup) {
      return res.status(404).json({
        success: false,
        message: 'Pickup not found'
      });
    }

    // Verify the agent claiming it
    if (!pickup.agentId || pickup.agentId.toString() !== agent._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You did not claim this pickup'
      });
    }

    // Don't allow release if already in progress or completed
    if (['in-progress', 'completed'].includes(pickup.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot release pickup in ${pickup.status} status`
      });
    }

    // Release the pickup back to scheduled status
    const updatedPickup = await Pickup.findByIdAndUpdate(
      pickupId,
      {
        $set: {
          agentId: null,
          status: 'scheduled',
          claimedAt: null
        }
      },
      { new: true }
    ).populate('userId', 'name email phone');

    // Create notification for user
    await Notification.create({
      userId: pickup.userId,
      type: 'pickup_released',
      title: 'Pickup Released',
      message: `The assigned agent has released your pickup. Your pickup is open for other agents.`,
      relatedPickup: pickup._id
    });

    // Notify user via socket
    const io = req.app.get('io');
    io.to(pickup.userId.toString()).emit('pickup-released', {
      pickupId: pickup._id
    });

    // Notify all agents that pickup is available again
    io.emit('pickup-available', {
      pickup: updatedPickup
    });

    res.status(200).json({
      success: true,
      message: 'Pickup released successfully',
      pickup: updatedPickup
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get agent's claimed pickups
// @route   GET /api/pickups/agent/my-pickups
// @access  Private (agents only)
exports.getAgentPickups = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const userId = req.user.id;

    // Get or create the agent (auto-create if missing - e.g. from registration)
    let agent = await Agent.findOne({ userId });
    if (!agent && req.user.role === 'agent') {
      agent = await Agent.create({
        userId: req.user._id,
        vehicleType: 'truck',
        vehicleNumber: 'PENDING',
        licenseNumber: 'PENDING',
        status: 'offline',
        isVerified: false
      });
    }
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent profile not found'
      });
    }

    let query = { agentId: agent._id };
    if (status) query.status = status;

    const pickups = await Pickup.find(query)
      .populate('userId', 'name email phone address')
      .sort({ claimedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Pickup.countDocuments(query);

    res.status(200).json({
      success: true,
      count: pickups.length,
      total,
      pages: Math.ceil(total / limit),
      pickups
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update pickup status (by agent or admin)
// @route   PUT /api/pickups/:id/status
// @access  Private
exports.updatePickupStatus = async (req, res) => {
  try {
    const { status, actualWeight } = req.body;
    const pickupId = req.params.id;
    const userId = req.user.id;

    // Get or create the agent or check if admin
    let agent = null;
    if (req.user.role === 'agent') {
      agent = await Agent.findOne({ userId });
      if (!agent) {
        agent = await Agent.create({
          userId: req.user._id,
          vehicleType: 'truck',
          vehicleNumber: 'PENDING',
          licenseNumber: 'PENDING',
          status: 'offline',
          isVerified: false
        });
      }
    }

    const pickup = await Pickup.findById(pickupId).populate('userId', 'name email');
    if (!pickup) {
      return res.status(404).json({
        success: false,
        message: 'Pickup not found'
      });
    }

    // Verify authorization
    if (req.user.role === 'agent') {
      if (!agent || pickup.agentId.toString() !== agent._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this pickup'
        });
      }
    }

    // Update the pickup
    const updateData = { status };
    if (actualWeight) updateData.actualWeight = actualWeight;
    if (status === 'completed') updateData.completedAt = new Date();
    if (status === 'cancelled') {
      updateData.cancelledAt = new Date();
      updateData.cancellationReason = req.body.cancellationReason || '';
    }

    const updatedPickup = await Pickup.findByIdAndUpdate(
      pickupId,
      updateData,
      { new: true, runValidators: true }
    ).populate('userId').populate('agentId');

    // Create notification
    const notificationMessages = {
      'in-progress': 'Your pickup is in progress',
      'completed': 'Your pickup has been completed! Thank you.',
      'cancelled': 'Your pickup has been cancelled'
    };

    if (status === 'completed' || status === 'cancelled') {
      await Notification.create({
        userId: pickup.userId,
        type: `pickup_${status}`,
        title: `Pickup ${status}`,
        message: notificationMessages[status],
        relatedPickup: pickup._id
      });
    }

    // Emit socket events
    const io = req.app.get('io');
    io.to(pickup.userId.toString()).emit('pickup-status-updated', {
      pickupId: pickup._id,
      status: updatedPickup.status
    });

    res.status(200).json({
      success: true,
      message: `Pickup status updated to ${status}`,
      pickup: updatedPickup
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get pickup details with agent info
// @route   GET /api/pickups/details/:id
// @access  Private
exports.getPickupDetails = async (req, res) => {
  try {
    const pickup = await Pickup.findById(req.params.id)
      .populate('userId', 'name email phone address')
      .populate('agentId', 'name phone vehicleNumber currentLocation');

    if (!pickup) {
      return res.status(404).json({
        success: false,
        message: 'Pickup not found'
      });
    }

    res.status(200).json({
      success: true,
      pickup
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
