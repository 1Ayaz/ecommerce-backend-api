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
    bookRapido,
    getRapidoStatus,
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
router.put('/:id/status', protect, authorize('vendor', 'admin'), validateMongoId, validateOrderStatus, updateOrderStatus);
router.put('/:id/assign-driver', protect, authorize('vendor'), restrictToOwnVendor, validateMongoId, assignDriver);

// Rapido parcel booking
router.post('/:id/book-rapido', protect, authorize('admin', 'vendor'), bookRapido);
router.get('/:id/rapido-status', protect, authorize('admin', 'vendor'), getRapidoStatus);

module.exports = router;
