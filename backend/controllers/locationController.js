const asyncHandler = require('express-async-handler');
const MapService = require('../services/MapService');

// @desc    Get address suggestions (Google Places)
// @route   GET /api/location/suggestions?input=...
const getSuggestions = asyncHandler(async (req, res) => {
    const { input } = req.query;
    const suggestions = await MapService.getAddressSuggestions(input);
    res.status(200).json({ success: true, data: suggestions });
});

// @desc    Get location details from placeId
// @route   GET /api/location/details/:placeId
const getPlaceDetails = asyncHandler(async (req, res) => {
    const details = await MapService.getPlaceDetails(req.params.placeId);
    res.status(200).json({ success: true, data: details });
});

// @desc    Reverse geocode lat/lng to address
// @route   GET /api/location/reverse-geocode?lat=...&lng=...
const reverseGeocode = asyncHandler(async (req, res) => {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
        res.status(400).json({ success: false, error: 'lat and lng are required' });
        return;
    }
    const formattedAddress = await MapService.reverseGeocode(parseFloat(lat), parseFloat(lng));
    res.status(200).json({ success: true, data: { formattedAddress } });
});

module.exports = {
    getSuggestions,
    getPlaceDetails,
    reverseGeocode,
};
