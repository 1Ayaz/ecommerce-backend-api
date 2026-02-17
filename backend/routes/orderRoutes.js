const express = require('express');
const router = express.Router();
const {
    placeOrder,
    getOrderHistory,
    getOrderById,
    updateOrderStatus,
    getStoreOrders,
    assignDriver,
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { restrictToOwnStore } = require('../middleware/storeMiddleware');
const { validateOrderCreation, validateMongoId, validateOrderStatus } = require('../middleware/validation');

// Customer routes
router.post('/', protect, validateOrderCreation, placeOrder);
router.get('/history', protect, getOrderHistory);
router.get('/:id', protect, validateMongoId, getOrderById);

// Vendor routes
router.put('/:id/status', protect, authorize('vendor', 'admin'), validateMongoId, validateOrderStatus, updateOrderStatus);
router.get('/vendor/store-orders', protect, authorize('vendor'), restrictToOwnStore, getStoreOrders);
router.put('/:id/assign-driver', protect, authorize('vendor'), restrictToOwnStore, validateMongoId, assignDriver);

module.exports = router;
