const Opportunity = require('../models/Opportunity');
const User = require('../models/User');
const Agent = require('../models/Agent');
const Notification = require('../models/Notification');

// Utility: Haversine distance in kilometers between two lat/lng points
const haversineDistanceKm = (coord1, coord2) => {
  if (!coord1 || !coord2 || coord1.lat == null || coord1.lng == null || coord2.lat == null || coord2.lng == null) {
    return null;
  }

  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLng = toRad(coord2.lng - coord1.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.lat)) *
      Math.cos(toRad(coord2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const normalizeTag = (value) => String(value || '').trim().toLowerCase();

const getOpportunityWasteTypes = (opportunity) => {
  const explicitWasteTypes = Array.isArray(opportunity?.wasteTypes) ? opportunity.wasteTypes : [];
  const fallbackSkills = Array.isArray(opportunity?.requiredSkills) ? opportunity.requiredSkills : [];
  return [...explicitWasteTypes, ...fallbackSkills]
    .map(normalizeTag)
    .filter(Boolean);
};

const computeVolunteerMatchScore = ({ volunteerSkills, opportunityWasteTypes, distanceKm, maxDistanceKm }) => {
  const volunteerSet = new Set((volunteerSkills || []).map(normalizeTag).filter(Boolean));
  const requiredSet = new Set((opportunityWasteTypes || []).map(normalizeTag).filter(Boolean));

  let wasteTypeScore = 0;
  if (requiredSet.size > 0) {
    let overlap = 0;
    requiredSet.forEach((tag) => {
      if (volunteerSet.has(tag)) {
        overlap += 1;
      }
    });
    wasteTypeScore = overlap / requiredSet.size;
  }

  let locationScore = 0.5;
  if (typeof distanceKm === 'number') {
    const bounded = Math.min(distanceKm, maxDistanceKm);
    locationScore = 1 - (bounded / maxDistanceKm);
  }

  const totalScore = (wasteTypeScore * 0.7) + (locationScore * 0.3);

  return {
    totalScore,
    wasteTypeScore,
    locationScore
  };
};

// @desc    Create a new volunteering opportunity (User posts, or Admin)
// @route   POST /api/opportunities
// @access  Private (User or Admin)
exports.createOpportunity = async (req, res) => {
  try {
    const {
      title,
      description,
      requiredSkills,
      wasteTypes,
      duration,
      location,
      startDate,
      endDate,
      maxVolunteers,
      category,
      contactEmail,
      contactPhone,
      imageUrl,
      requirements,
      status
    } = req.body;

    // User (opportunity poster) or Admin can create
    if (req.user.role !== 'admin' && req.user.role !== 'user') {
      return res.status(403).json({
        success: false,
        message: 'Only users (opportunity posters) or administrators can create opportunities'
      });
    }

    // Enforce initial status based on role:
    // - Regular users: always start in pending_review (NGO must review)
    // - Admins: may explicitly set a status, otherwise default to pending_review
    let initialStatus = 'pending_review';
    if (req.user.role === 'admin' && status) {
      initialStatus = status;
    }

    // Ensure we have coordinates for mapping; if missing, generate around Hyderabad
    let finalLocation = location;
    if (location && (!location.coordinates || location.coordinates.lat == null || location.coordinates.lng == null)) {
      const baseLat = 17.3850;
      const baseLng = 78.4867;
      const lat = baseLat + (Math.random() - 0.5) * 0.05;
      const lng = baseLng + (Math.random() - 0.5) * 0.05;
      finalLocation = {
        ...location,
        coordinates: { lat, lng }
      };
    }

    const opportunity = await Opportunity.create({
      title,
      description,
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : (requiredSkills ? requiredSkills.split(',').map(s => s.trim()) : []),
      wasteTypes: Array.isArray(wasteTypes) ? wasteTypes : (wasteTypes ? wasteTypes.split(',').map(s => s.trim()) : []),
      duration,
      location: finalLocation,
      startDate,
      endDate,
      maxVolunteers,
      category,
      contactEmail,
      contactPhone,
      imageUrl,
      requirements,
      status: initialStatus,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Opportunity created successfully',
      data: opportunity
    });
  } catch (error) {
    console.error('Error creating opportunity:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating opportunity'
    });
  }
};

// @desc    Get all volunteering opportunities
// @route   GET /api/opportunities
// @access  Public
exports.getAllOpportunities = async (req, res) => {
  try {
    const { status, category, search, limit = 20, page = 1 } = req.query;
    
    const filter = {};
    
    // Filter by status
    if (status) {
      // Backwards compatibility: map "active" to the new active statuses
      if (status === 'active') {
        filter.status = { $in: ['assigned', 'in_progress'] };
      } else {
        filter.status = status;
      }
    } else {
      // By default, show only active opportunities for non-admins
      if (!req.user || req.user.role !== 'admin') {
        filter.status = { $in: ['assigned', 'in_progress'] };
        filter.startDate = { $lte: new Date() };
        filter.endDate = { $gte: new Date() };
      }
    }
    
    // Filter by category
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    // Search by title or description
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const opportunities = await Opportunity.find(filter)
      .populate('createdBy', 'name email')
      .populate('currentVolunteers.user', 'name email')
      .sort({ startDate: 1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Opportunity.countDocuments(filter);

    res.json({
      success: true,
      data: opportunities,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching opportunities'
    });
  }
};

// @desc    Get single opportunity by ID
// @route   GET /api/opportunities/:id
// @access  Public
exports.getOpportunityById = async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id)
      .populate('createdBy', 'name email phone')
      .populate('currentVolunteers.user', 'name email phone');

    if (!opportunity) {
      return res.status(404).json({
        success: false,
        message: 'Opportunity not found'
      });
    }

    res.json({
      success: true,
      data: opportunity
    });
  } catch (error) {
    console.error('Error fetching opportunity:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching opportunity'
    });
  }
};

// @desc    Update an opportunity
// @route   PUT /api/opportunities/:id
// @access  Private (Admin only)
exports.updateOpportunity = async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id);

    if (!opportunity) {
      return res.status(404).json({
        success: false,
        message: 'Opportunity not found'
      });
    }

    // Verify user is admin, creator (user), or NGO that accepted
    const isCreator = opportunity.createdBy.toString() === req.user._id.toString();
    const isNgoOwner = opportunity.acceptedBy && opportunity.acceptedBy.toString() === req.user._id.toString();
    if (req.user.role !== 'admin' && !isCreator && !isNgoOwner) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this opportunity'
      });
    }

    const {
      title,
      description,
      requiredSkills,
      wasteTypes,
      duration,
      location,
      startDate,
      endDate,
      maxVolunteers,
      category,
      contactEmail,
      contactPhone,
      imageUrl,
      requirements,
      status
    } = req.body;

    // Update fields
    if (title) opportunity.title = title;
    if (description) opportunity.description = description;
    if (requiredSkills) {
      opportunity.requiredSkills = Array.isArray(requiredSkills) 
        ? requiredSkills 
        : requiredSkills.split(',').map(s => s.trim());
    }
    if (wasteTypes) {
      opportunity.wasteTypes = Array.isArray(wasteTypes)
        ? wasteTypes
        : wasteTypes.split(',').map(s => s.trim());
    }
    if (duration) opportunity.duration = duration;
    if (location) opportunity.location = location;
    if (startDate) opportunity.startDate = startDate;
    if (endDate) opportunity.endDate = endDate;
    if (maxVolunteers) opportunity.maxVolunteers = maxVolunteers;
    if (category) opportunity.category = category;
    if (contactEmail !== undefined) opportunity.contactEmail = contactEmail;
    if (contactPhone !== undefined) opportunity.contactPhone = contactPhone;
    if (imageUrl !== undefined) opportunity.imageUrl = imageUrl;
    if (requirements !== undefined) opportunity.requirements = requirements;
    if (status) opportunity.status = status;

    await opportunity.save();

    res.json({
      success: true,
      message: 'Opportunity updated successfully',
      data: opportunity
    });
  } catch (error) {
    console.error('Error updating opportunity:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating opportunity'
    });
  }
};

// @desc    Delete an opportunity
// @route   DELETE /api/opportunities/:id
// @access  Private (Admin only)
exports.deleteOpportunity = async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id);

    if (!opportunity) {
      return res.status(404).json({
        success: false,
        message: 'Opportunity not found'
      });
    }

    // Verify user is admin or creator (NGO can update status but delete typically stays with creator/admin)
    if (req.user.role !== 'admin' && opportunity.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this opportunity'
      });
    }

    // Notify volunteers if any
    if (opportunity.currentVolunteers.length > 0) {
      const volunteerIds = opportunity.currentVolunteers.map(v => v.user);
      
      for (const userId of volunteerIds) {
        await Notification.create({
          user: userId,
          title: 'Opportunity Cancelled',
          message: `The volunteering opportunity "${opportunity.title}" has been cancelled.`,
          type: 'info'
        });
      }
    }

    await Opportunity.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Opportunity deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting opportunity:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting opportunity'
    });
  }
};

// @desc    Apply for a volunteering opportunity
// @route   POST /api/opportunities/:id/apply
// @access  Private
exports.applyForOpportunity = async (req, res) => {
  try {
    // New flow: volunteers are assigned by NGOs, not via open applications.
    return res.status(400).json({
      success: false,
      message: 'Direct applications are disabled. Opportunities are reviewed by NGOs and assigned to volunteers.'
    });
  } catch (error) {
    console.error('Error applying for opportunity:', error);
    res.status(500).json({
      success: false,
      message: 'Error applying for opportunity'
    });
  }
};

// @desc    Manage volunteer application (approve/reject)
// @route   PUT /api/opportunities/:id/volunteers/:volunteerId
// @access  Private (Admin only)
exports.manageVolunteerApplication = async (req, res) => {
  try {
    const { status } = req.body; // 'approved' or 'rejected'
    const { id, volunteerId } = req.params;

    const opportunity = await Opportunity.findById(id);

    if (!opportunity) {
      return res.status(404).json({
        success: false,
        message: 'Opportunity not found'
      });
    }

    // Verify user is admin or creator
    if (req.user.role !== 'admin' && opportunity.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to manage volunteers'
      });
    }

    // Find volunteer
    const volunteer = opportunity.currentVolunteers.find(
      v => v.user.toString() === volunteerId
    );

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: 'Volunteer not found'
      });
    }

    // Update status
    volunteer.status = status;
    await opportunity.save();

    // Create notification for volunteer
    const notificationMessage = status === 'approved'
      ? `Your application for "${opportunity.title}" has been approved!`
      : `Your application for "${opportunity.title}" has been rejected.`;

    await Notification.create({
      user: volunteerId,
      title: `Application ${status === 'approved' ? 'Approved' : 'Rejected'}`,
      message: notificationMessage,
      type: status === 'approved' ? 'success' : 'info'
    });

    res.json({
      success: true,
      message: `Volunteer ${status} successfully`,
      data: opportunity
    });
  } catch (error) {
    console.error('Error managing volunteer application:', error);
    res.status(500).json({
      success: false,
      message: 'Error managing volunteer application'
    });
  }
};

// @desc    NGO accepts an opportunity (reviews and takes it under coordination)
// @route   POST /api/opportunities/:id/accept
// @access  Private (NGO only)
exports.acceptOpportunity = async (req, res) => {
  try {
    if (req.user.role !== 'ngo') {
      return res.status(403).json({
        success: false,
        message: 'Only NGOs can accept opportunities'
      });
    }

    const opportunity = await Opportunity.findById(req.params.id);
    if (!opportunity) {
      return res.status(404).json({ success: false, message: 'Opportunity not found' });
    }

    // Idempotent accept: if already accepted by this NGO, return success.
    if (opportunity.status === 'accepted' && opportunity.acceptedBy?.toString() === req.user._id.toString()) {
      return res.json({
        success: true,
        message: 'Opportunity is already accepted by you',
        data: opportunity
      });
    }

    if (opportunity.status !== 'pending_review') {
      return res.status(400).json({
        success: false,
        message: `Opportunity cannot be accepted in its current status (${opportunity.status})`
      });
    }

    opportunity.acceptedBy = req.user._id;
    opportunity.acceptedAt = new Date();
    opportunity.status = 'accepted';
    await opportunity.save();

    await Notification.create({
      user: opportunity.createdBy,
      title: 'Opportunity Accepted',
      message: `An NGO has accepted your opportunity "${opportunity.title}". They will assign a volunteer soon.`,
      type: 'info'
    });

    res.json({
      success: true,
      message: 'Opportunity accepted successfully',
      data: opportunity
    });
  } catch (error) {
    console.error('Error accepting opportunity:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error accepting opportunity'
    });
  }
};

// @desc    Get ranked volunteer matches for an opportunity
// @route   GET /api/opportunities/:id/volunteer-matches
// @access  Private (NGO only)
exports.getOpportunityVolunteerMatches = async (req, res) => {
  try {
    if (req.user.role !== 'ngo') {
      return res.status(403).json({
        success: false,
        message: 'Only NGOs can view volunteer matches'
      });
    }

    const opportunity = await Opportunity.findById(req.params.id)
      .populate('acceptedBy', '_id')
      .lean();

    if (!opportunity) {
      return res.status(404).json({ success: false, message: 'Opportunity not found' });
    }

    if (opportunity.acceptedBy?._id?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the NGO that accepted this opportunity can view volunteer matches'
      });
    }

    const maxDistanceKm = Math.max(parseInt(req.query.maxDistanceKm || '30', 10), 1);
    const limit = Math.max(parseInt(req.query.limit || '20', 10), 1);

    const volunteerAgents = await Agent.find({
      isVerified: true,
      status: { $in: ['available', 'offline', 'busy'] }
    })
      .populate('userId', 'name email phone role skills address isActive')
      .lean();

    const opportunityWasteTypes = getOpportunityWasteTypes(opportunity);
    const alreadyAssigned = new Set((opportunity.assignedTo || []).map((a) => String(a.volunteer)));

    const matchedVolunteers = volunteerAgents
      .filter((agent) => agent?.userId && agent.userId.role === 'agent' && agent.userId.isActive)
      .filter((agent) => !alreadyAssigned.has(String(agent.userId._id)))
      .map((agent) => {
        const user = agent.userId;
        const volunteerCoords = user.address?.coordinates;
        const opportunityCoords = opportunity.location?.coordinates;
        const distanceKm = haversineDistanceKm(opportunityCoords, volunteerCoords);

        const scores = computeVolunteerMatchScore({
          volunteerSkills: user.skills || [],
          opportunityWasteTypes,
          distanceKm,
          maxDistanceKm
        });

        const matchedWasteTypes = opportunityWasteTypes.filter((tag) =>
          (user.skills || []).map(normalizeTag).includes(tag)
        );

        return {
          userId: user._id,
          agentProfileId: agent._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          skills: user.skills || [],
          agentStatus: agent.status,
          isVerified: agent.isVerified,
          distanceKm,
          score: Number(scores.totalScore.toFixed(4)),
          scoreBreakdown: {
            wasteType: Number(scores.wasteTypeScore.toFixed(4)),
            location: Number(scores.locationScore.toFixed(4))
          },
          matchedWasteTypes,
          matchReason: {
            wasteTypesRequired: opportunityWasteTypes,
            wasteTypesMatched: matchedWasteTypes.length,
            withinDistance: typeof distanceKm === 'number' ? distanceKm <= maxDistanceKm : null
          }
        };
      })
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (a.distanceKm == null && b.distanceKm == null) return 0;
        if (a.distanceKm == null) return 1;
        if (b.distanceKm == null) return -1;
        return a.distanceKm - b.distanceKm;
      })
      .slice(0, limit);

    res.json({
      success: true,
      data: matchedVolunteers,
      meta: {
        total: matchedVolunteers.length,
        scoring: {
          wasteTypeWeight: 0.7,
          locationWeight: 0.3,
          maxDistanceKm
        }
      }
    });
  } catch (error) {
    console.error('Error fetching volunteer matches:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching volunteer matches'
    });
  }
};

// @desc    NGO assigns opportunity to a volunteer
// @route   POST /api/opportunities/:id/assign
// @access  Private (NGO only)
exports.assignOpportunity = async (req, res) => {
  try {
    if (req.user.role !== 'ngo') {
      return res.status(403).json({
        success: false,
        message: 'Only NGOs can assign opportunities to volunteers'
      });
    }

    const { volunteerId } = req.body;
    if (!volunteerId) {
      return res.status(400).json({
        success: false,
        message: 'volunteerId is required'
      });
    }

    const opportunity = await Opportunity.findById(req.params.id)
      .populate('acceptedBy', '_id');
    if (!opportunity) {
      return res.status(404).json({ success: false, message: 'Opportunity not found' });
    }
    if (opportunity.acceptedBy?._id?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the NGO that accepted this opportunity can assign volunteers'
      });
    }

    // Opportunity must be accepted or still pending review before assignment
    if (!['accepted', 'pending_review'].includes(opportunity.status)) {
      return res.status(400).json({
        success: false,
        message: 'Opportunity cannot be assigned in its current status'
      });
    }

    const volunteer = await User.findById(volunteerId);
    if (!volunteer || volunteer.role !== 'agent') {
      return res.status(400).json({
        success: false,
        message: 'Invalid volunteer. Must be an agent (volunteer).'
      });
    }

    const alreadyAssigned = opportunity.assignedTo.some(
      a => a.volunteer.toString() === volunteerId
    );
    if (alreadyAssigned) {
      return res.status(400).json({
        success: false,
        message: 'Volunteer is already assigned to this opportunity'
      });
    }

    if ((opportunity.assignedTo || []).length >= opportunity.maxVolunteers) {
      return res.status(400).json({
        success: false,
        message: 'No assignment slots remaining for this opportunity'
      });
    }

    if (!volunteer.isActive) {
      return res.status(400).json({
        success: false,
        message: 'This volunteer account is inactive'
      });
    }

    opportunity.assignedTo.push({
      volunteer: volunteerId,
      assignedBy: req.user._id
    });

    // Ensure NGO ownership is recorded if not already
    if (!opportunity.acceptedBy) {
      opportunity.acceptedBy = req.user._id;
      opportunity.acceptedAt = new Date();
    }

    // Once a volunteer is assigned, mark as assigned
    opportunity.status = 'assigned';
    await opportunity.save();

    await Notification.create({
      user: volunteerId,
      title: 'New Task Assigned',
      message: `You have been assigned to "${opportunity.title}" by the NGO.`,
      type: 'info'
    });

    res.json({
      success: true,
      message: 'Volunteer assigned successfully',
      data: opportunity
    });
  } catch (error) {
    console.error('Error assigning opportunity:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error assigning opportunity'
    });
  }
};

// @desc    Get user's applications
// @route   GET /api/opportunities/my-applications
// @access  Private
exports.getMyApplications = async (req, res) => {
  try {
    const opportunities = await Opportunity.find({
      'currentVolunteers.user': req.user._id
    })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    // Map to include user's application status
    const applicationsWithStatus = opportunities.map(opp => {
      const volunteer = opp.currentVolunteers.find(
        v => v.user.toString() === req.user._id.toString()
      );
      return {
        ...opp.toObject(),
        myApplicationStatus: volunteer.status,
        myAppliedAt: volunteer.appliedAt
      };
    });

    res.json({
      success: true,
      data: applicationsWithStatus
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching applications'
    });
  }
};

// @desc    Get my opportunities (as creator, as NGO coordinator, or as assigned volunteer)
// @route   GET /api/opportunities/my-opportunities
// @access  Private
exports.getMyOpportunities = async (req, res) => {
  try {
    let query;
    if (req.user.role === 'user' || req.user.role === 'admin') {
      query = { createdBy: req.user._id };
    } else if (req.user.role === 'ngo') {
      query = { acceptedBy: req.user._id };
    } else if (req.user.role === 'agent') {
      query = { 'assignedTo.volunteer': req.user._id };
    } else {
      query = { createdBy: req.user._id };
    }

    const opportunities = await Opportunity.find(query)
      .populate('createdBy', 'name email phone')
      .populate('acceptedBy', 'name email')
      .populate('currentVolunteers.user', 'name email phone')
      .populate('assignedTo.volunteer', 'name email phone')
      .populate('assignedTo.assignedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: opportunities
    });
  } catch (error) {
    console.error('Error fetching my opportunities:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching opportunities'
    });
  }
};

// @desc    Get opportunities: for NGO = pending review ones to accept; for Volunteer = only assigned to me
// @route   GET /api/opportunities/match
// @access  Private
exports.getMatchedOpportunities = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Volunteer (agent): only see opportunities assigned to them by NGO
    if (req.user.role === 'agent') {
      const assigned = await Opportunity.find({
        'assignedTo.volunteer': userId
      })
        .populate('createdBy', 'name email')
        .populate('acceptedBy', 'name email')
        .sort({ createdAt: -1 })
        .limit(parseInt(req.query.limit || '20', 10));
      return res.json({
        success: true,
        data: assigned,
        meta: { total: assigned.length, returned: assigned.length }
      });
    }

    // NGO: see opportunities pending NGO review
    const now = new Date();
    const limit = parseInt(req.query.limit || '20', 10);
    const opportunities = await Opportunity.find({
      status: 'pending_review',
      startDate: { $lte: now },
      endDate: { $gte: now }
    })
      .populate('createdBy', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: opportunities,
      meta: {
        total: opportunities.length,
        returned: opportunities.length
      }
    });
  } catch (error) {
    console.error('Error matching opportunities:', error);
    res.status(500).json({
      success: false,
      message: 'Error matching opportunities'
    });
  }
};

// @desc    NGO rejects an opportunity (with optional reason)
// @route   POST /api/opportunities/:id/reject
// @access  Private (NGO only)
exports.rejectOpportunity = async (req, res) => {
  try {
    if (req.user.role !== 'ngo') {
      return res.status(403).json({
        success: false,
        message: 'Only NGOs can reject opportunities'
      });
    }

    const { reason } = req.body;
    const opportunity = await Opportunity.findById(req.params.id);

    if (!opportunity) {
      return res.status(404).json({
        success: false,
        message: 'Opportunity not found'
      });
    }

    if (!['pending_review', 'accepted'].includes(opportunity.status)) {
      return res.status(400).json({
        success: false,
        message: 'Only pending or accepted opportunities can be rejected'
      });
    }

    opportunity.status = 'rejected';
    opportunity.rejectionReason = reason || 'No reason provided';
    await opportunity.save();

    // Notify the user who posted the opportunity
    await Notification.create({
      user: opportunity.createdBy,
      title: 'Opportunity Rejected',
      message: `Your opportunity "${opportunity.title}" was rejected by the NGO.${reason ? ` Reason: ${reason}` : ''}`,
      type: 'info'
    });

    res.json({
      success: true,
      message: 'Opportunity rejected successfully',
      data: opportunity
    });
  } catch (error) {
    console.error('Error rejecting opportunity:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error rejecting opportunity'
    });
  }
};

// @desc    Volunteer marks opportunity as completed
// @route   POST /api/opportunities/:id/complete
// @access  Private (Agent only)
exports.completeOpportunity = async (req, res) => {
  try {
    if (req.user.role !== 'agent') {
      return res.status(403).json({
        success: false,
        message: 'Only volunteers can complete opportunities'
      });
    }

    const opportunity = await Opportunity.findById(req.params.id);

    if (!opportunity) {
      return res.status(404).json({
        success: false,
        message: 'Opportunity not found'
      });
    }

    const isAssignedToAgent = opportunity.assignedTo.some(
      (a) => a.volunteer.toString() === req.user._id.toString()
    );

    if (!isAssignedToAgent) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this opportunity'
      });
    }

    if (!['assigned', 'in_progress'].includes(opportunity.status)) {
      return res.status(400).json({
        success: false,
        message: 'Only assigned or in-progress opportunities can be completed'
      });
    }

    opportunity.status = 'completed';
    await opportunity.save();

    // Notify user and NGO (if any)
    const notifications = [];
    notifications.push(Notification.create({
      user: opportunity.createdBy,
      title: 'Opportunity Completed',
      message: `The opportunity "${opportunity.title}" has been marked as completed by the volunteer.`,
      type: 'success'
    }));

    if (opportunity.acceptedBy) {
      notifications.push(Notification.create({
        user: opportunity.acceptedBy,
        title: 'Opportunity Completed',
        message: `The opportunity "${opportunity.title}" you coordinated has been marked as completed.`,
        type: 'success'
      }));
    }

    await Promise.all(notifications);

    res.json({
      success: true,
      message: 'Opportunity marked as completed',
      data: opportunity
    });
  } catch (error) {
    console.error('Error completing opportunity:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error completing opportunity'
    });
  }
};
