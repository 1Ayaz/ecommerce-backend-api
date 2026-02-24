const express = require('express');
const router = express.Router();
const { getSettings, getPublicSettings, updateSettings, updateBanners, updateLogo } = require('../controllers/settingsController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public route — banners, logo for frontend
router.get('/public', getPublicSettings);

// Admin routes
router.route('/')
    .get(protect, authorize('admin'), getSettings)
    .put(protect, authorize('admin'), updateSettings);

router.put('/banners', protect, authorize('admin'), updateBanners);
router.put('/logo', protect, authorize('admin'), updateLogo);

module.exports = router;
