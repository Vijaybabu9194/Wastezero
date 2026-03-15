const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllUsers,
  getAllPickups,
  getAllOpportunities,
  getAllAgents,
  verifyAgent,
  toggleUserStatus,
  updateUserStatus,
  getEngagementReport,
  removeOpportunity
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getDashboardStats);
router.get('/reports/engagement', getEngagementReport);
router.get('/users', getAllUsers);
router.get('/pickups', getAllPickups);
router.get('/opportunities', getAllOpportunities);
router.get('/agents', getAllAgents);

router.put('/agents/:id/verify', verifyAgent);
router.put('/users/:id/toggle-status', toggleUserStatus);
router.put('/users/:id/status', updateUserStatus);
router.delete('/opportunities/:id', removeOpportunity);

module.exports = router;
