const express = require('express');
const router = express.Router();
const {
    getNearbyStore,
    getStoreById,
    getAllStores,
    createStore,
    updateStore,
    deleteStore,
    updateDeliveryConfig
} = require('../controllers/storeController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { restrictToOwnVendor } = require('../middleware/storeMiddleware');
const { validateStoreNearby, validateMongoId, validateStore } = require('../middleware/validation');

router.get('/nearby', validateStoreNearby, getNearbyStore);
router.get('/:id', validateMongoId, getStoreById);

// Protected routes
router.get('/', protect, authorize('admin', 'vendor'), restrictToOwnVendor, getAllStores);
router.post('/', protect, authorize('admin'), validateStore, createStore);
// Admin: update store commission rate
router.put('/:id/commission', protect, authorize('admin'), validateMongoId, async (req, res) => {
    const Store = require('../models/Store');
    const store = await Store.findById(req.params.id);
    if (!store) return res.status(404).json({ success: false, message: 'Store not found' });
    store.commissionPercentage = req.body.commissionPercentage ?? null;
    await store.save();
    res.json({ success: true, data: store });
});

// Vendor delivery pricing config
router.put('/:id/delivery-config', protect, authorize('admin', 'vendor'), updateDeliveryConfig);

router.put('/:id', protect, authorize('admin', 'vendor'), restrictToOwnVendor, validateMongoId, validateStore, updateStore);
router.delete('/:id', protect, authorize('admin'), validateMongoId, deleteStore);


module.exports = router;
