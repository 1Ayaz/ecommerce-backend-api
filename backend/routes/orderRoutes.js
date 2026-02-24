const express = require('express');
const router = express.Router();
const {
    placeOrder,
    getAllOrders,
    getOrderHistory,
    getOrderById,
    updateOrderStatus,
    getVendorOrders,
    assignDriver,
    previewOrder,
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { restrictToOwnVendor } = require('../middleware/storeMiddleware');
const { validateOrderCreation, validateMongoId, validateOrderStatus } = require('../middleware/validation');
const { orderLimiter } = require('../middleware/rateLimit');

// Admin route — all orders (must come before :id)
router.get('/', protect, authorize('admin'), getAllOrders);

// Vendor specific routes (must come before :id routes)
router.get('/vendor/store-orders', protect, authorize('vendor'), restrictToOwnVendor, getVendorOrders);

// Customer routes
router.post('/preview', protect, orderLimiter, validateOrderCreation, previewOrder);
router.post('/', protect, orderLimiter, validateOrderCreation, placeOrder);
router.get('/history', protect, getOrderHistory);

// Parameterized routes
router.get('/:id', protect, validateMongoId, getOrderById);
router.put('/:id/status', protect, authorize('vendor'), validateMongoId, validateOrderStatus, updateOrderStatus);
router.put('/:id/assign-driver', protect, authorize('vendor'), restrictToOwnVendor, validateMongoId, assignDriver);

module.exports = router;
