const express = require('express');
const router = express.Router();
const { sendOtp, verifyOtp, googleSignIn, adminLogin, getMe, refreshAccessToken } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validatePhone, validateOTP, validateEmail } = require('../middleware/validation');

// OTP Auth (Primary)
router.post('/send-otp', validatePhone, sendOtp);
router.post('/verify-otp', validateOTP, verifyOtp);

// Google OAuth (Secondary)
router.post('/google', googleSignIn);

// Admin/Vendor Login
router.post('/admin-login', validateEmail, adminLogin);

// Protected
router.get('/me', protect, getMe);
router.post('/refresh', refreshAccessToken);

module.exports = router;
