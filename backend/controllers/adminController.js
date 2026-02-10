const Pickup = require('../models/Pickup');
const User = require('../models/User');
const Agent = require('../models/Agent');
const Notification = require('../models/Notification');

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Private (Admin)
exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalAgents = await Agent.countDocuments({ isVerified: true });
    const totalPickups = await Pickup.countDocuments();
    const completedPickups = await Pickup.countDocuments({ status: 'completed' });
    const pendingPickups = await Pickup.countDocuments({ status: 'scheduled' });
    const activePickups = await Pickup.countDocuments({ status: { $in: ['assigned', 'in-progress'] } });
    
    // Get total waste collected
    const wasteStats = await Pickup.aggregate([
      { $match: { status: 'completed' } },
      { 
        $group: {
          _id: null,
          totalWeight: { $sum: '$actualWeight' }
        }
      }
    ]);
    
    const totalWasteCollected = wasteStats.length > 0 ? wasteStats[0].totalWeight : 0;
    
    // Get waste by category
    const wasteByCategoryData = await Pickup.aggregate([
      { $match: { status: 'completed' } },
      { $unwind: '$wasteCategories' },
      {
        $group: {
          _id: '$wasteCategories.type',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get monthly pickup trends
    const monthlyTrends = await Pickup.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalAgents,
        totalPickups,
        completedPickups,
        pendingPickups,
        activePickups,
        totalWasteCollected,
        wasteByCategoryData,
        monthlyTrends
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    
    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    const users = await User.find(query)
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    
    const total = await User.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: users.length,
      total,
      pages: Math.ceil(total / limit),
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all pickups
// @route   GET /api/admin/pickups
// @access  Private (Admin)
exports.getAllPickups = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, date } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.scheduledDate = { $gte: startDate, $lt: endDate };
    }
    
    const pickups = await Pickup.find(query)
      .populate('userId', 'name email phone')
      .populate('agentId', 'name phone')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    
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

// @desc    Get all agents
// @route   GET /api/admin/agents
// @access  Private (Admin)
exports.getAllAgents = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, verified } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (verified !== undefined) query.isVerified = verified === 'true';
    
    const agents = await Agent.find(query)
      .populate('userId', 'name email phone')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    
    const total = await Agent.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: agents.length,
      total,
      pages: Math.ceil(total / limit),
      agents
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Verify agent
// @route   PUT /api/admin/agents/:id/verify
// @access  Private (Admin)
exports.verifyAgent = async (req, res) => {
  try {
    const agent = await Agent.findByIdAndUpdate(
      req.params.id,
      { isVerified: true },
      { new: true }
    ).populate('userId');
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }
    
    // Create notification
    await Notification.create({
      userId: agent.userId._id,
      type: 'system_alert',
      title: 'Account Verified',
      message: 'Your agent account has been verified. You can now start accepting pickups.'
    });
    
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

// @desc    Toggle user active status
// @route   PUT /api/admin/users/:id/toggle-status
// @access  Private (Admin)
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    user.isActive = !user.isActive;
    await user.save();
    
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
