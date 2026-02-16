const express = require('express');
const router = express.Router();
const { placeOrder, getOrderHistory, getOrderById, updateOrderStatus } = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, placeOrder);
router.get('/history', protect, getOrderHistory);
router.get('/:id', protect, getOrderById);
router.put('/:id/status', protect, authorize('vendor', 'admin'), updateOrderStatus);

module.exports = router;
