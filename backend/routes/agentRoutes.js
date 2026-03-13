const express = require('express');
const router = express.Router();
const {
  findAvailableAgents,
  assignAgent,
  getAgentPickups,
  updatePickupStatus,
  updateLocation,
  updateAgentStatus,
  getVolunteersList
} = require('../controllers/agentController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/volunteers', authorize('admin', 'ngo'), getVolunteersList);
router.post('/find-available', authorize('admin'), findAvailableAgents);
router.post('/assign', authorize('admin'), assignAgent);

router.get('/pickups', authorize('agent'), getAgentPickups);
router.put('/pickups/:id/status', authorize('agent'), updatePickupStatus);

router.put('/location', authorize('agent'), updateLocation);
router.put('/status', authorize('agent'), updateAgentStatus);

module.exports = router;
