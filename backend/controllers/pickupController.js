const Pickup = require('../models/Pickup');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Create new pickup request
// @route   POST /api/pickups
// @access  Private
exports.createPickup = async (req, res) => {
  try {
    const { wasteCategories, scheduledDate, scheduledTimeSlot, pickupAddress } = req.body;
    
    const pickup = await Pickup.create({
      userId: req.user.id,
      wasteCategories,
      scheduledDate,
      scheduledTimeSlot,
      pickupAddress
    });
    
    // Create notification
    await Notification.create({
      userId: req.user.id,
      type: 'pickup_scheduled',
      title: 'Pickup Scheduled',
      message: `Your waste pickup has been scheduled for ${new Date(scheduledDate).toLocaleDateString()}`,
      relatedPickup: pickup._id
    });
    
    // Emit socket event for real-time notification
    const io = req.app.get('io');
    io.to(req.user.id.toString()).emit('notification', {
      type: 'pickup_scheduled',
      pickup
    });
    
    res.status(201).json({
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

// @desc    Get all pickups for logged in user
// @route   GET /api/pickups
// @access  Private
exports.getUserPickups = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const query = { userId: req.user.id };
    if (status) query.status = status;
    
    const pickups = await Pickup.find(query)
      .populate('agentId', 'name phone vehicleNumber')
      .sort({ createdAt: -1 })
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

// @desc    Get pickup by ID
// @route   GET /api/pickups/:id
// @access  Private
exports.getPickup = async (req, res) => {
  try {
    const pickup = await Pickup.findById(req.params.id)
      .populate('userId', 'name email phone')
      .populate('agentId', 'name phone vehicleNumber currentLocation');
    
    if (!pickup) {
      return res.status(404).json({
        success: false,
        message: 'Pickup not found'
      });
    }
    
    // Check if user is authorized to view this pickup
    if (pickup.userId._id.toString() !== req.user.id && req.user.role !== 'admin') {
      // Check if user is the assigned agent
      if (req.user.role === 'agent') {
        const Agent = require('../models/Agent');
        const agent = await Agent.findOne({ userId: req.user.id });
        if (!agent || pickup.agentId?._id.toString() !== agent._id.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Not authorized to access this pickup'
          });
        }
      } else {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this pickup'
        });
      }
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

// @desc    Update pickup
// @route   PUT /api/pickups/:id
// @access  Private
exports.updatePickup = async (req, res) => {
  try {
    let pickup = await Pickup.findById(req.params.id);
    
    if (!pickup) {
      return res.status(404).json({
        success: false,
        message: 'Pickup not found'
      });
    }
    
    // Check ownership
    if (pickup.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this pickup'
      });
    }
    
    // Don't allow updates if pickup is in progress or completed
    if (['in-progress', 'completed'].includes(pickup.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update pickup in current status'
      });
    }
    
    pickup = await Pickup.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
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

// @desc    Cancel pickup
// @route   DELETE /api/pickups/:id
// @access  Private
exports.cancelPickup = async (req, res) => {
  try {
    const pickup = await Pickup.findById(req.params.id);
    
    if (!pickup) {
      return res.status(404).json({
        success: false,
        message: 'Pickup not found'
      });
    }
    
    // Check ownership
    if (pickup.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this pickup'
      });
    }
    
    // Don't allow cancellation if already completed
    if (pickup.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed pickup'
      });
    }
    
    pickup.status = 'cancelled';
    pickup.cancelledAt = Date.now();
    pickup.cancellationReason = req.body.reason || 'Cancelled by user';
    await pickup.save();
    
    // Create notification
    await Notification.create({
      userId: pickup.userId,
      type: 'pickup_cancelled',
      title: 'Pickup Cancelled',
      message: 'Your waste pickup has been cancelled',
      relatedPickup: pickup._id
    });
    
    // Notify agent if assigned
    if (pickup.agentId) {
      const Agent = require('../models/Agent');
      const agent = await Agent.findById(pickup.agentId).populate('userId');
      
      await Notification.create({
        userId: agent.userId._id,
        type: 'pickup_cancelled',
        title: 'Pickup Cancelled',
        message: 'A pickup request has been cancelled',
        relatedPickup: pickup._id
      });
      
      const io = req.app.get('io');
      io.to(agent.userId._id.toString()).emit('notification', {
        type: 'pickup_cancelled',
        pickup
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Pickup cancelled successfully',
      pickup
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Rate completed pickup
// @route   POST /api/pickups/:id/rate
// @access  Private
exports.ratePickup = async (req, res) => {
  try {
    const { score, review } = req.body;
    
    const pickup = await Pickup.findById(req.params.id);
    
    if (!pickup) {
      return res.status(404).json({
        success: false,
        message: 'Pickup not found'
      });
    }
    
    // Check ownership
    if (pickup.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to rate this pickup'
      });
    }
    
    if (pickup.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only rate completed pickups'
      });
    }
    
    pickup.rating = { score, review };
    await pickup.save();
    
    // Update agent rating
    if (pickup.agentId) {
      const Agent = require('../models/Agent');
      const agent = await Agent.findById(pickup.agentId);
      
      const newCount = agent.rating.count + 1;
      const newAverage = ((agent.rating.average * agent.rating.count) + score) / newCount;
      
      agent.rating.average = newAverage;
      agent.rating.count = newCount;
      await agent.save();
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
