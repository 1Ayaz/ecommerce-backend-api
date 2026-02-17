const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { restrictToOwnStore } = require('../middleware/storeMiddleware');
const {
    getAssignedOrders,
    updateDeliveryStatus,
    getDeliveryHistory,
} = require('../controllers/deliveryController');

// All routes require authentication and driver role
router.use(protect);
router.use(authorize('driver'));
router.use(restrictToOwnStore);

// @route   GET /api/delivery/orders
router.get('/orders', getAssignedOrders);

// @route   PUT /api/delivery/orders/:id/status
router.put('/orders/:id/status', updateDeliveryStatus);

// @route   GET /api/delivery/history
router.get('/history', getDeliveryHistory);

module.exports = router;
