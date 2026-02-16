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
  getMyOpportunities
} = require('../controllers/opportunityController');

// Public routes
router.get('/', getAllOpportunities);
router.get('/:id', getOpportunityById);

// Protected routes - require authentication
router.use(protect);

// User routes
router.get('/user/my-applications', getMyApplications);
router.post('/:id/apply', applyForOpportunity);

// Admin routes
router.post('/create', createOpportunity);
router.get('/admin/my-opportunities', getMyOpportunities);
router.put('/:id', updateOpportunity);
router.delete('/:id', deleteOpportunity);
router.put('/:id/volunteers/:volunteerId', manageVolunteerApplication);

module.exports = router;
