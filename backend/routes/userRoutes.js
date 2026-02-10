const express = require('express');
const router = express.Router();
const { getUserProfile, getUserStats } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/profile', getUserProfile);
router.get('/stats', getUserStats);

module.exports = router;
