const Opportunity = require('../models/Opportunity');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Create a new volunteering opportunity
// @route   POST /api/opportunities
// @access  Private (Admin only)
exports.createOpportunity = async (req, res) => {
  try {
    const {
      title,
      description,
      requiredSkills,
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

    // Verify user is admin
    if (req.user.role !== 'user') {
      return res.status(403).json({
        success: false,
        message: 'Only create opportunities'
      });
    }

    const opportunity = await Opportunity.create({
      title,
      description,
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : requiredSkills.split(',').map(s => s.trim()),
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
      status: status || 'active',
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
      filter.status = status;
    } else {
      // By default, show only active opportunities for non-admins
      if (!req.user || req.user.role !== 'user') {
        filter.status = 'active';
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

    // Verify user is admin or creator
    if (req.user.role !== 'admin' && opportunity.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this opportunity'
      });
    }

    const {
      title,
      description,
      requiredSkills,
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

    // Verify user is admin or creator
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
// @access  Private (User)
exports.applyForOpportunity = async (req, res) => {
  try {


    // Only agents can apply
if (req.user.role !== 'agent') {
  return res.status(403).json({
    success: false,
    message: 'Only agents can apply for opportunities'
  });
}
    const opportunity = await Opportunity.findById(req.params.id);

    if (!opportunity) {
      return res.status(404).json({
        success: false,
        message: 'Opportunity not found'
      });
    }

    // Check if opportunity is active
    if (opportunity.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'This opportunity is not currently active'
      });
    }

    // Check if opportunity is full
    if (opportunity.isFull) {
      return res.status(400).json({
        success: false,
        message: 'This opportunity is already full'
      });
    }

    // Check if user already applied
    const alreadyApplied = opportunity.currentVolunteers.some(
      v => v.user.toString() === req.user._id.toString()
    );

    if (alreadyApplied) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this opportunity'
      });
    }

    // Add user to volunteers list
    opportunity.currentVolunteers.push({
      user: req.user._id,
      status: 'pending'
    });

    await opportunity.save();

    // Create notification for admin
    await Notification.create({
      user: opportunity.createdBy,
      title: 'New Volunteer Application',
      message: `${req.user.name} has applied for "${opportunity.title}"`,
      type: 'info'
    });

    res.json({
      success: true,
      message: 'Application submitted successfully',
      data: opportunity
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

// @desc    Get opportunities created by admin
// @route   GET /api/opportunities/my-opportunities
// @access  Private (Admin only)
exports.getMyOpportunities = async (req, res) => {
  try {
    const opportunities = await Opportunity.find({ createdBy: req.user._id })
      .populate('currentVolunteers.user', 'name email phone')
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
