const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllUsers,
  getAllPickups,
  getAllAgents,
  verifyAgent,
  toggleUserStatus
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.get('/pickups', getAllPickups);
router.get('/agents', getAllAgents);

router.put('/agents/:id/verify', verifyAgent);
router.put('/users/:id/toggle-status', toggleUserStatus);

module.exports = router;
