const Agent = require('../models/Agent');
const Pickup = require('../models/Pickup');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Helper function to calculate distance between two coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

const deg2rad = (deg) => {
  return deg * (Math.PI / 180);
};

// @desc    Find available agents near pickup location
// @route   POST /api/agents/find-available
// @access  Private (Admin)
exports.findAvailableAgents = async (req, res) => {
  try {
    const { pickupId } = req.body;
    
    const pickup = await Pickup.findById(pickupId);
    if (!pickup) {
      return res.status(404).json({
        success: false,
        message: 'Pickup not found'
      });
    }
    
    // Get all available agents
    const agents = await Agent.find({ status: 'available', isVerified: true })
      .populate('userId', 'name phone email');
    
    // Calculate distance and filter nearby agents
    const nearbyAgents = agents
      .map(agent => {
        if (!agent.currentLocation?.coordinates?.lat || !pickup.pickupAddress?.coordinates?.lat) {
          return null;
        }
        
        const distance = calculateDistance(
          agent.currentLocation.coordinates.lat,
          agent.currentLocation.coordinates.lng,
          pickup.pickupAddress.coordinates.lat,
          pickup.pickupAddress.coordinates.lng
        );
        
        return {
          agent,
          distance
        };
      })
      .filter(item => item !== null && item.distance <= 50) // Within 50km
      .sort((a, b) => {
        // Sort by rating first, then by distance
        if (a.agent.rating.average !== b.agent.rating.average) {
          return b.agent.rating.average - a.agent.rating.average;
        }
        return a.distance - b.distance;
      });
    
    res.status(200).json({
      success: true,
      count: nearbyAgents.length,
      agents: nearbyAgents
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Assign agent to pickup
// @route   POST /api/agents/assign
// @access  Private (Admin or Auto-assignment)
exports.assignAgent = async (req, res) => {
  try {
    const { pickupId, agentId } = req.body;
    
    const pickup = await Pickup.findById(pickupId);
    if (!pickup) {
      return res.status(404).json({
        success: false,
        message: 'Pickup not found'
      });
    }
    
    const agent = await Agent.findById(agentId).populate('userId');
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }
    
    if (agent.status !== 'available') {
      return res.status(400).json({
        success: false,
        message: 'Agent is not available'
      });
    }
    
    // Assign agent to pickup
    pickup.agentId = agentId;
    pickup.status = 'assigned';
    await pickup.save();
    
    // Update agent status
    agent.status = 'busy';
    await agent.save();
    
    // Create notifications
    await Notification.create({
      userId: pickup.userId,
      type: 'agent_assigned',
      title: 'Agent Assigned',
      message: `Agent ${agent.userId.name} has been assigned to your pickup`,
      relatedPickup: pickup._id
    });
    
    await Notification.create({
      userId: agent.userId._id,
      type: 'agent_assigned',
      title: 'New Pickup Assigned',
      message: 'You have been assigned a new pickup request',
      relatedPickup: pickup._id
    });
    
    // Emit socket events
    const io = req.app.get('io');
    io.to(pickup.userId.toString()).emit('notification', {
      type: 'agent_assigned',
      pickup,
      agent
    });
    
    io.to(agent.userId._id.toString()).emit('notification', {
      type: 'new_pickup_assigned',
      pickup
    });
    
    res.status(200).json({
      success: true,
      pickup,
      agent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get agent's assigned pickups
// @route   GET /api/agents/pickups
// @access  Private (Agent)
exports.getAgentPickups = async (req, res) => {
  try {
    const agent = await Agent.findOne({ userId: req.user.id });
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent profile not found'
      });
    }
    
    const { status, page = 1, limit = 10 } = req.query;
    
    const query = { agentId: agent._id };
    if (status) query.status = status;
    
    const pickups = await Pickup.find(query)
      .populate('userId', 'name phone address email')
      .sort({ scheduledDate: 1 })
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

// @desc    Update pickup status by agent
// @route   PUT /api/agents/pickups/:id/status
// @access  Private (Agent)
exports.updatePickupStatus = async (req, res) => {
  try {
    const { status, actualWeight } = req.body;
    
    const agent = await Agent.findOne({ userId: req.user.id });
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent profile not found'
      });
    }
    
    const pickup = await Pickup.findById(req.params.id);
    
    if (!pickup) {
      return res.status(404).json({
        success: false,
        message: 'Pickup not found'
      });
    }
    
    // Verify agent is assigned to this pickup
    if (pickup.agentId.toString() !== agent._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this pickup'
      });
    }
    
    pickup.status = status;
    
    if (status === 'in-progress') {
      await Notification.create({
        userId: pickup.userId,
        type: 'pickup_started',
        title: 'Pickup Started',
        message: 'Your waste pickup is in progress',
        relatedPickup: pickup._id
      });
    }
    
    if (status === 'completed') {
      pickup.completedAt = Date.now();
      if (actualWeight) {
        pickup.actualWeight = actualWeight;
      }
      
      // Update agent status back to available
      agent.status = 'available';
      agent.completedPickups += 1;
      agent.totalWeightCollected += actualWeight || 0;
      await agent.save();
      
      // Update user waste statistics
      const user = await User.findById(pickup.userId);
      user.wasteStats.totalPickups += 1;
      user.wasteStats.totalWeight += actualWeight || 0;
      
      // Update category-wise stats
      pickup.wasteCategories.forEach(category => {
        const weight = (actualWeight || 0) / pickup.wasteCategories.length; // Distribute weight evenly
        switch (category.type) {
          case 'plastic':
            user.wasteStats.plasticWeight += weight;
            break;
          case 'organic':
            user.wasteStats.organicWeight += weight;
            break;
          case 'e-waste':
            user.wasteStats.ewasteWeight += weight;
            break;
          case 'paper':
            user.wasteStats.paperWeight += weight;
            break;
          case 'glass':
            user.wasteStats.glassWeight += weight;
            break;
          case 'metal':
            user.wasteStats.metalWeight += weight;
            break;
        }
      });
      
      await user.save();
      
      await Notification.create({
        userId: pickup.userId,
        type: 'pickup_completed',
        title: 'Pickup Completed',
        message: 'Your waste pickup has been completed successfully',
        relatedPickup: pickup._id
      });
    }
    
    await pickup.save();
    
    // Emit socket event
    const io = req.app.get('io');
    io.to(pickup.userId.toString()).emit('notification', {
      type: `pickup_${status}`,
      pickup
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

// @desc    Update agent location
// @route   PUT /api/agents/location
// @access  Private (Agent)
exports.updateLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    
    const agent = await Agent.findOneAndUpdate(
      { userId: req.user.id },
      {
        currentLocation: {
          coordinates: { lat, lng },
          lastUpdated: Date.now()
        }
      },
      { new: true }
    );
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent profile not found'
      });
    }
    
    res.status(200).json({
      success: true,
      agent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update agent status
// @route   PUT /api/agents/status
// @access  Private (Agent)
exports.updateAgentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const agent = await Agent.findOneAndUpdate(
      { userId: req.user.id },
      { status },
      { new: true }
    );
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent profile not found'
      });
    }
    
    res.status(200).json({
      success: true,
      agent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
