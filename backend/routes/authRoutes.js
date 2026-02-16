const express = require('express');
const router = express.Router();
const { sendOtp, verifyOtp, googleSignIn, adminLogin, getMe, refreshAccessToken } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// OTP Auth (Primary)
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);

// Google OAuth (Secondary)
router.post('/google', googleSignIn);

// Admin
router.post('/admin-login', adminLogin);

// Protected
router.get('/me', protect, getMe);
router.post('/refresh', refreshAccessToken);

module.exports = router;
