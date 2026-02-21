const express = require('express');
const router = express.Router();
const { getSuggestions, getPlaceDetails, reverseGeocode } = require('../controllers/locationController');
const isDev = process.env.NODE_ENV !== 'production';
const rateLimit = isDev ? null : require('express-rate-limit');

// Location routes are public (used before login in LocationPicker)
// but rate-limited in production to prevent API cost abuse
const locationLimiter = isDev ? (req, res, next) => next() : rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // 30 requests per 15 min per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: { message: 'Too many location requests. Please try again later.' }
    },
});

router.use(locationLimiter);

router.get('/suggestions', getSuggestions);
router.get('/details/:placeId', getPlaceDetails);
router.get('/reverse-geocode', reverseGeocode);

module.exports = router;
