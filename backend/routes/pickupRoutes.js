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
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getUserPickups)
  .post(createPickup);

router.route('/:id')
  .get(getPickup)
  .put(updatePickup)
  .delete(cancelPickup);

router.post('/:id/rate', ratePickup);

module.exports = router;
