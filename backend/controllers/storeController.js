const asyncHandler = require('express-async-handler');
const Store = require('../models/Store');

// @desc    Get nearby store based on pincode or coordinates
// @route   GET /api/stores/nearby?pincode=...&lat=...&lng=...
// @access  Public
const getNearbyStore = asyncHandler(async (req, res) => {
    const { pincode, lat, lng } = req.query;

    let store;

    // Priority 1: Pincode match
    if (pincode) {
        store = await Store.findOne({
            servicePincodes: pincode,
            isOpen: true,
        });
    }

    // Priority 2: Geo-based (if coordinates provided and no pincode match)
    if (!store && lat && lng) {
        store = await Store.findOne({
            location: {
                $near: {
                    $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
                    $maxDistance: 5000, // 5km default
                },
            },
            isOpen: true,
        });
    }

    if (!store) {
        res.status(404);
        throw new Error('No serviceable store found in your area');
    }

    res.status(200).json({ success: true, data: store });
});

// @desc    Get store by ID
// @route   GET /api/stores/:id
// @access  Public
const getStoreById = asyncHandler(async (req, res) => {
    const store = await Store.findById(req.params.id);

    if (!store) {
        res.status(404);
        throw new Error('Store not found');
    }

    res.status(200).json({ success: true, data: store });
});

module.exports = { getNearbyStore, getStoreById };
