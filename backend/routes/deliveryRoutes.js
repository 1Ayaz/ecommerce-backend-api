const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { restrictToOwnVendor } = require('../middleware/storeMiddleware');
const {
    getAssignedOrders,
    updateDeliveryStatus,
    getDeliveryHistory,
    toggleOnline,
    getEarnings,
} = require('../controllers/deliveryController');

// All routes require authentication and driver role
router.use(protect);
router.use(authorize('driver'));
router.use(restrictToOwnVendor);

// @route   GET /api/delivery/orders
router.get('/orders', getAssignedOrders);

// @route   PUT /api/delivery/orders/:id/status
router.put('/orders/:id/status', updateDeliveryStatus);

// @route   GET /api/delivery/history
router.get('/history', getDeliveryHistory);

// @route   PUT /api/delivery/online
router.put('/online', toggleOnline);

// @route   GET /api/delivery/earnings
router.get('/earnings', getEarnings);

module.exports = router;
