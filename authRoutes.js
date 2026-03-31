const express = require('express');
const router = express.Router();
const {
  register,
  login,
  verifyRegistrationOTP,
  verifyLoginOTP,
  resendOTP,
  getMe,
  updateProfile,
  updatePassword
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/verify-registration-otp', verifyRegistrationOTP);
router.post('/verify-login-otp', verifyLoginOTP);
router.post('/resend-otp', resendOTP);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, updatePassword);

module.exports = router;
