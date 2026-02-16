const express = require('express');
const router = express.Router();
const { googleSignIn, adminLogin, getMe, refreshAccessToken } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/google', googleSignIn);
router.post('/admin-login', adminLogin);
router.get('/me', protect, getMe);
router.post('/refresh', refreshAccessToken);

module.exports = router;
