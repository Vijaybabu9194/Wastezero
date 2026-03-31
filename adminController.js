const Pickup = require('../models/Pickup');
const User = require('../models/User');
const Agent = require('../models/Agent');
const Opportunity = require('../models/Opportunity');
const Notification = require('../models/Notification');

const buildMonthlyBuckets = (months = 6) => {
  const buckets = [];
  const current = new Date();

  for (let index = months - 1; index >= 0; index -= 1) {
    const date = new Date(current.getFullYear(), current.getMonth() - index, 1);
    buckets.push({
      key: `${date.getFullYear()}-${date.getMonth() + 1}`,
      label: date.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      newUsers: 0,
      pickups: 0,
      opportunities: 0,
      volunteerResponses: 0
    });
  }

  return buckets;
};

const mergeMonthlyCounts = (buckets, rows, fieldName) => {
  rows.forEach((row) => {
    const key = `${row._id.year}-${row._id.month}`;
    const bucket = buckets.find((item) => item.key === key);
    if (bucket) {
      bucket[fieldName] = row.count;
    }
  });
};

const getRangeStart = (range) => {
  const now = new Date();

  switch (range) {
    case 'today':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case 'week': {
      const date = new Date(now);
      date.setDate(now.getDate() - 7);
      return date;
    }
    case 'month':
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case 'quarter':
      return new Date(now.getFullYear(), now.getMonth() - 2, 1);
    case 'year':
      return new Date(now.getFullYear(), 0, 1);
    default:
      return null;
  }
};

const getEngagementAnalytics = async (range = 'all') => {
  const since = getRangeStart(range);
  const dateMatch = since ? { createdAt: { $gte: since } } : {};

  const [
    totalUsers,
    activeUsers,
    suspendedUsers,
    totalAgents,
    totalPickups,
    completedPickups,
    pendingPickups,
    activePickups,
    totalOpportunities,
    activeOpportunities,
    pendingReviewOpportunities,
    completedOpportunities,
    totalWasteCollectedRows,
    wasteByCategoryData,
    pickupMonthly,
    userMonthly,
    opportunityMonthly,
    volunteerMonthly,
    opportunityStatusBreakdown,
    volunteerResponseBreakdown,
    topOpportunityCreators,
    recentUsers,
    recentOpportunities,
    recentResponses
  ] = await Promise.all([
    User.countDocuments({ role: { $ne: 'admin' } }),
    User.countDocuments({ role: { $ne: 'admin' }, isActive: true, updatedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }),
    User.countDocuments({ role: { $ne: 'admin' }, isActive: false }),
    Agent.countDocuments({ isVerified: true }),
    Pickup.countDocuments(),
    Pickup.countDocuments({ status: 'completed' }),
    Pickup.countDocuments({ status: 'scheduled' }),
    Pickup.countDocuments({ status: { $in: ['assigned', 'in-progress'] } }),
    Opportunity.countDocuments(),
    Opportunity.countDocuments({ status: { $in: ['accepted', 'assigned', 'in_progress'] } }),
    Opportunity.countDocuments({ status: 'pending_review' }),
    Opportunity.countDocuments({ status: 'completed' }),
    Pickup.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, totalWeight: { $sum: '$actualWeight' } } }
    ]),
    Pickup.aggregate([
      { $match: { status: 'completed' } },
      { $unwind: '$wasteCategories' },
      { $group: { _id: '$wasteCategories.type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    Pickup.aggregate([
      { $match: { createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 5)) } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]),
    User.aggregate([
      { $match: { ...dateMatch, role: { $ne: 'admin' } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]),
    Opportunity.aggregate([
      { $match: dateMatch },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]),
    Opportunity.aggregate([
      { $match: dateMatch },
      { $unwind: '$currentVolunteers' },
      { $group: { _id: { year: { $year: '$currentVolunteers.appliedAt' }, month: { $month: '$currentVolunteers.appliedAt' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]),
    Opportunity.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    Opportunity.aggregate([
      { $unwind: '$currentVolunteers' },
      { $group: { _id: '$currentVolunteers.status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    Opportunity.aggregate([
      { $group: { _id: '$createdBy', postedOpportunities: { $sum: 1 } } },
      { $sort: { postedOpportunities: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: '$user._id',
          name: '$user.name',
          email: '$user.email',
          postedOpportunities: 1
        }
      }
    ]),
    User.find({ role: { $ne: 'admin' } })
      .select('name email role isActive createdAt updatedAt suspensionReason')
      .sort({ updatedAt: -1 })
      .limit(6)
      .lean(),
    Opportunity.find()
      .select('title status category createdAt currentVolunteers maxVolunteers createdBy')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(6)
      .lean(),
    Opportunity.find({ 'currentVolunteers.0': { $exists: true } })
      .select('title currentVolunteers createdAt')
      .sort({ updatedAt: -1 })
      .limit(6)
      .lean()
  ]);

  const monthlyTrends = buildMonthlyBuckets();
  mergeMonthlyCounts(monthlyTrends, pickupMonthly, 'pickups');
  mergeMonthlyCounts(monthlyTrends, userMonthly, 'newUsers');
  mergeMonthlyCounts(monthlyTrends, opportunityMonthly, 'opportunities');
  mergeMonthlyCounts(monthlyTrends, volunteerMonthly, 'volunteerResponses');

  const totalVolunteerResponses = volunteerResponseBreakdown.reduce((sum, item) => sum + item.count, 0);
  const totalWasteCollected = totalWasteCollectedRows[0]?.totalWeight || 0;

  return {
    totalUsers,
    activeUsers,
    suspendedUsers,
    totalAgents,
    totalPickups,
    completedPickups,
    pendingPickups,
    activePickups,
    totalWasteCollected,
    totalOpportunities,
    activeOpportunities,
    pendingReviewOpportunities,
    completedOpportunities,
    totalVolunteerResponses,
    approvedVolunteerResponses: volunteerResponseBreakdown.find((item) => item._id === 'approved')?.count || 0,
    pendingVolunteerResponses: volunteerResponseBreakdown.find((item) => item._id === 'pending')?.count || 0,
    rejectedVolunteerResponses: volunteerResponseBreakdown.find((item) => item._id === 'rejected')?.count || 0,
    wasteByCategoryData,
    monthlyTrends,
    opportunityStatusBreakdown,
    volunteerResponseBreakdown,
    topOpportunityCreators,
    recentUsers,
    recentOpportunities: recentOpportunities.map((opportunity) => ({
      ...opportunity,
      responseCount: opportunity.currentVolunteers?.length || 0,
      approvedCount: opportunity.currentVolunteers?.filter((entry) => entry.status === 'approved').length || 0
    })),
    recentResponses: recentResponses.map((opportunity) => ({
      _id: opportunity._id,
      title: opportunity.title,
      responseCount: opportunity.currentVolunteers?.length || 0,
      latestResponseAt: opportunity.currentVolunteers?.reduce((latest, entry) => {
        if (!latest || new Date(entry.appliedAt) > new Date(latest)) {
          return entry.appliedAt;
        }
        return latest;
      }, null)
    }))
  };
};

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Private (Admin)
exports.getDashboardStats = async (req, res) => {
  try {
    const stats = await getEngagementAnalytics('all');
    
    res.status(200).json({
      success: true,
      stats
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
    const { page = 1, limit = 20, role, search, status } = req.query;
    
    const query = {};
    if (role) query.role = role;
    if (status === 'active') query.isActive = true;
    if (status === 'suspended') query.isActive = false;
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

// @desc    Get all opportunities for admin moderation
// @route   GET /api/admin/opportunities
// @access  Private (Admin)
exports.getAllOpportunities = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search, category } = req.query;

    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const opportunities = await Opportunity.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Opportunity.countDocuments(query);

    res.status(200).json({
      success: true,
      count: opportunities.length,
      total,
      pages: Math.ceil(total / limit),
      opportunities: opportunities.map((opportunity) => ({
        ...opportunity,
        responseCount: opportunity.currentVolunteers?.length || 0,
        approvedCount: opportunity.currentVolunteers?.filter((entry) => entry.status === 'approved').length || 0
      }))
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
      .populate({
        path: 'agentId',
        select: 'vehicleNumber status userId',
        populate: {
          path: 'userId',
          select: 'name email phone'
        }
      })
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

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot suspend your own account'
      });
    }
    
    user.isActive = !user.isActive;
    user.suspendedAt = user.isActive ? null : new Date();
    user.suspendedBy = user.isActive ? null : req.user._id;
    user.suspensionReason = user.isActive ? null : 'Account suspended by an administrator';
    await user.save();

    await Notification.create({
      userId: user._id,
      type: 'system_alert',
      title: user.isActive ? 'Account Restored' : 'Account Suspended',
      message: user.isActive
        ? 'Your account access has been restored by an administrator.'
        : 'Your account has been suspended by an administrator.'
    });
    
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

// @desc    Set user active status explicitly
// @route   PUT /api/admin/users/:id/status
// @access  Private (Admin)
exports.updateUserStatus = async (req, res) => {
  try {
    const { isActive, reason } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user._id.toString() === req.user._id.toString() && isActive === false) {
      return res.status(400).json({
        success: false,
        message: 'You cannot suspend your own account'
      });
    }

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be provided as a boolean'
      });
    }

    user.isActive = isActive;
    user.suspendedAt = isActive ? null : new Date();
    user.suspendedBy = isActive ? null : req.user._id;
    user.suspensionReason = isActive ? null : (reason?.trim() || 'Account suspended by an administrator');
    await user.save();

    await Notification.create({
      userId: user._id,
      type: 'system_alert',
      title: isActive ? 'Account Restored' : 'Account Suspended',
      message: isActive
        ? 'Your account has been reactivated by an administrator.'
        : user.suspensionReason
    });

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

// @desc    Get engagement report
// @route   GET /api/admin/reports/engagement
// @access  Private (Admin)
exports.getEngagementReport = async (req, res) => {
  try {
    const { range = 'all' } = req.query;
    const since = getRangeStart(range);
    const dateQuery = since ? { createdAt: { $gte: since } } : {};
    const analytics = await getEngagementAnalytics(range);

    const [userActivity, opportunityCategoryBreakdown] = await Promise.all([
      User.find({ role: { $ne: 'admin' } })
        .select('name email role isActive createdAt updatedAt')
        .sort({ updatedAt: -1 })
        .limit(10)
        .lean(),
      Opportunity.aggregate([
        { $match: dateQuery },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    const enrichedUsers = await Promise.all(
      userActivity.map(async (user) => {
        const [opportunitiesPosted, volunteerResponses, pickupsScheduled] = await Promise.all([
          Opportunity.countDocuments({ createdBy: user._id }),
          Opportunity.countDocuments({ 'currentVolunteers.user': user._id }),
          Pickup.countDocuments({ userId: user._id })
        ]);

        return {
          ...user,
          opportunitiesPosted,
          volunteerResponses,
          pickupsScheduled
        };
      })
    );

    res.status(200).json({
      success: true,
      report: {
        range,
        summary: {
          activeUsers: analytics.activeUsers,
          suspendedUsers: analytics.suspendedUsers,
          postedOpportunities: analytics.totalOpportunities,
          volunteerResponses: analytics.totalVolunteerResponses,
          activeOpportunities: analytics.activeOpportunities,
          pendingReviewOpportunities: analytics.pendingReviewOpportunities
        },
        monthlyEngagement: analytics.monthlyTrends,
        opportunityStatusBreakdown: analytics.opportunityStatusBreakdown,
        opportunityCategoryBreakdown,
        volunteerResponseBreakdown: analytics.volunteerResponseBreakdown,
        topOpportunityCreators: analytics.topOpportunityCreators,
        userActivity: enrichedUsers,
        recentOpportunities: analytics.recentOpportunities,
        recentUsers: analytics.recentUsers
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Remove opportunity as admin
// @route   DELETE /api/admin/opportunities/:id
// @access  Private (Admin)
exports.removeOpportunity = async (req, res) => {
  try {
    const { reason } = req.body || {};
    const opportunity = await Opportunity.findById(req.params.id)
      .populate('createdBy', 'name email')
      .lean();

    if (!opportunity) {
      return res.status(404).json({
        success: false,
        message: 'Opportunity not found'
      });
    }

    const volunteerIds = (opportunity.currentVolunteers || []).map((entry) => entry.user).filter(Boolean);
    const removalMessage = reason?.trim()
      ? `Your opportunity "${opportunity.title}" was removed by an administrator. Reason: ${reason.trim()}`
      : `Your opportunity "${opportunity.title}" was removed by an administrator.`;

    if (opportunity.createdBy?._id) {
      await Notification.create({
        userId: opportunity.createdBy._id,
        type: 'system_alert',
        title: 'Opportunity Removed',
        message: removalMessage
      });
    }

    await Promise.all(
      volunteerIds.map((userId) => Notification.create({
        userId,
        type: 'system_alert',
        title: 'Opportunity Removed',
        message: `The opportunity "${opportunity.title}" is no longer available.`
      }))
    );

    await Opportunity.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Opportunity removed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Exported for unit tests
exports.__testables = {
  buildMonthlyBuckets,
  mergeMonthlyCounts,
  getRangeStart
};
