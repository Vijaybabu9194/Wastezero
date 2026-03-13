const express = require('express');
const router = express.Router();
const {
  createPickup,
  getUserPickups,
  getPickup,
  updatePickup,
  cancelPickup,
  ratePickup
} = require('../controllers/pickupController');
const {
  getAvailablePickups,
  claimPickup,
  releasePickup,
  getAgentPickups,
  updatePickupStatus,
  getPickupDetails
} = require('../controllers/agentPickupController');
const { protect } = require('../middleware/auth');

router.use(protect);

// User pickup routes
router.route('/')
  .get(getUserPickups)
  .post(createPickup);

router.route('/:id')
  .get(getPickup)
  .put(updatePickup)
  .delete(cancelPickup);

router.post('/:id/rate', ratePickup);

// Agent pickup routes
router.get('/agent/available', getAvailablePickups);
router.get('/agent/my-pickups', getAgentPickups);
router.post('/:id/claim', claimPickup);
router.post('/:id/release', releasePickup);
router.put('/:id/status', updatePickupStatus);
router.get('/details/:id', getPickupDetails);

module.exports = router;
