const asyncHandler = require('express-async-handler');
const Store = require('../models/Store');

// Known pincode → coordinates map (Rajahmundry area)
const PINCODE_COORDS = {
    '533101': { lat: 17.0005, lng: 81.804 },
    '533103': { lat: 17.0100, lng: 81.810 },
    '533104': { lat: 16.9900, lng: 81.800 },
    '533105': { lat: 17.0200, lng: 81.815 },
    '533106': { lat: 16.9800, lng: 81.795 },
};

// @desc    Get nearby store based on coordinates or pincode
// @route   GET /api/stores/nearby?lat=...&lng=... OR ?pincode=...
// @access  Public
const getNearbyStore = asyncHandler(async (req, res) => {
    let { lat, lng, pincode } = req.query;

    // Resolve pincode → coordinates if lat/lng not provided
    if ((!lat || !lng) && pincode) {
        const coords = PINCODE_COORDS[pincode];
        if (coords) {
            lat = coords.lat;
            lng = coords.lng;
        }
    }

    if (!lat || !lng) {
        res.status(400);
        throw new Error('Coordinates (lat, lng) or a valid pincode are required');
    }

    // Find store where the customer point is INSIDE the serviceArea polygon
    const store = await Store.findOne({
        isActive: true,
        serviceArea: {
            $geoIntersects: {
                $geometry: {
                    type: 'Point',
                    coordinates: [parseFloat(lng), parseFloat(lat)]
                }
            }
        }
    });

    if (!store) {
        res.status(404);
        throw new Error('No serviceable store found in your area');
    }

    res.status(200).json({ success: true, data: store });
});


// @desc    Get all stores
// @route   GET /api/stores
const getAllStores = asyncHandler(async (req, res) => {
    const query = {};

    // If restricted by middleware, only show the user's vendor
    if (req.userVendorId) {
        query._id = req.userVendorId;
    }

    const stores = await Store.find(query);
    res.status(200).json({ success: true, count: stores.length, data: stores });
});

// @desc    Get store by ID
const getStoreById = asyncHandler(async (req, res) => {
    const store = await Store.findById(req.params.id);
    if (!store) {
        res.status(404);
        throw new Error('Store not found');
    }
    res.status(200).json({ success: true, data: store });
});

// @desc    Create a store
const createStore = asyncHandler(async (req, res) => {
    const store = await Store.create(req.body);
    res.status(201).json({ success: true, data: store });
});

// @desc    Update a store
const updateStore = asyncHandler(async (req, res) => {
    let store = await Store.findById(req.params.id);

    if (!store) {
        res.status(404);
        throw new Error('Store not found');
    }

    // Authorization: Vendor can only update THEIR store and only specific fields
    if (req.user.role === 'vendor') {
        if (req.user.vendorId.toString() !== req.params.id) {
            res.status(403);
            throw new Error('Not authorized to update this store');
        }

        // Vendors can only update certain operational fields
        const allowedUpdates = ['isActive', 'isOpen', 'deliveryConfig'];
        const updates = Object.keys(req.body);
        const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

        if (!isValidOperation) {
            res.status(400);
            throw new Error('Vendors can only update store status and delivery config. Location and service area must be handled by Admin.');
        }
    }

    store = await Store.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });

    res.status(200).json({ success: true, data: store });
});

// @desc    Delete a store
// @route   DELETE /api/stores/:id
// @access  Private (Admin)
const deleteStore = asyncHandler(async (req, res) => {
    const store = await Store.findById(req.params.id);

    if (!store) {
        res.status(404);
        throw new Error('Store not found');
    }

    await store.deleteOne();
    res.status(200).json({ success: true, message: 'Store removed' });
});

// @desc    Update vendor delivery pricing config
// @route   PUT /api/stores/:id/delivery-config
// @access  Private (Vendor or Admin)
const updateDeliveryConfig = asyncHandler(async (req, res) => {
    const store = await Store.findById(req.params.id);
    if (!store) {
        res.status(404);
        throw new Error('Store not found');
    }

    // Vendor can only update their own store
    if (req.user.role === 'vendor' && req.user.vendorId?.toString() !== req.params.id) {
        res.status(403);
        throw new Error('Not authorized to update this store');
    }

    const { freeDeliveryRadiusKm, freeDeliveryAboveAmount, deliverySlabs } = req.body;

    if (freeDeliveryRadiusKm !== undefined) store.deliveryConfig.freeDeliveryRadiusKm = freeDeliveryRadiusKm;
    if (freeDeliveryAboveAmount !== undefined) store.deliveryConfig.freeDeliveryAboveAmount = freeDeliveryAboveAmount;
    if (deliverySlabs) store.deliveryConfig.deliverySlabs = deliverySlabs;

    await store.save();
    res.status(200).json({ success: true, data: store.deliveryConfig });
});

module.exports = {
    getNearbyStore,
    getStoreById,
    getAllStores,
    createStore,
    updateStore,
    deleteStore,
    updateDeliveryConfig
};
