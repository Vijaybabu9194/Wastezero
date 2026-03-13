const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createOpportunity,
  getAllOpportunities,
  getOpportunityById,
  updateOpportunity,
  deleteOpportunity,
  applyForOpportunity,
  manageVolunteerApplication,
  getMyApplications,
  getMyOpportunities,
  getMatchedOpportunities,
  acceptOpportunity,
  assignOpportunity,
  rejectOpportunity,
  completeOpportunity
} = require('../controllers/opportunityController');

// Public routes
router.get('/', getAllOpportunities);
// Matched opportunities (NGO: open list; Volunteer: assigned) - must be before /:id
router.get('/match/recommended', protect, getMatchedOpportunities);
router.get('/:id', getOpportunityById);

// Protected routes - require authentication
router.use(protect);

// User routes
router.get('/user/my-applications', getMyApplications);
router.post('/:id/apply', applyForOpportunity);

// Create: User (poster) or Admin
router.post('/create', createOpportunity);
router.get('/admin/my-opportunities', getMyOpportunities);
// NGO: accept opportunity, then assign to volunteer, or reject
router.post('/:id/accept', acceptOpportunity);
router.post('/:id/assign', assignOpportunity);
router.post('/:id/reject', rejectOpportunity);
// Volunteer: mark assigned opportunity as completed
router.post('/:id/complete', completeOpportunity);
router.put('/:id', updateOpportunity);
router.delete('/:id', deleteOpportunity);
router.put('/:id/volunteers/:volunteerId', manageVolunteerApplication);

module.exports = router;
