const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const User = require('../models/User');

// @desc    Get assigned orders for delivery boy
// @route   GET /api/delivery/orders
// @access  Private (Delivery)
const getAssignedOrders = asyncHandler(async (req, res) => {
    const deliveryBoy = req.user;

    if (!deliveryBoy.storeId) {
        res.status(403);
        throw new Error('Delivery boy is not assigned to any store');
    }

    const orders = await Order.find({
        driverId: deliveryBoy._id,
        storeId: deliveryBoy.storeId,
        status: { $in: ['accepted', 'cutting', 'ready', 'out'] },
    })
        .populate('customerId', 'name phone')
        .populate('storeId', 'name address')
        .sort({ placedAt: -1 });

    res.status(200).json({ success: true, count: orders.length, data: orders });
});

// @desc    Update delivery status
// @route   PUT /api/delivery/orders/:id/status
// @access  Private (Delivery)
const updateDeliveryStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const deliveryBoy = req.user;

    // Allowed status transitions for delivery boy
    const allowedStatuses = ['cutting', 'ready', 'out', 'delivered'];

    if (!allowedStatuses.includes(status)) {
        res.status(400);
        throw new Error(`Invalid status. Allowed: ${allowedStatuses.join(', ')}`);
    }

    const order = await Order.findOne({
        _id: req.params.id,
        driverId: deliveryBoy._id,
        storeId: deliveryBoy.storeId,
    });

    if (!order) {
        res.status(404);
        throw new Error('Order not found or not assigned to you');
    }

    order.status = status;
    const updated = await order.save();

    res.status(200).json({ success: true, data: updated });
});

// @desc    Get delivery history
// @route   GET /api/delivery/history
// @access  Private (Delivery)
const getDeliveryHistory = asyncHandler(async (req, res) => {
    const deliveryBoy = req.user;

    const orders = await Order.find({
        driverId: deliveryBoy._id,
        status: 'delivered',
    })
        .populate('customerId', 'name phone')
        .populate('storeId', 'name')
        .sort({ updatedAt: -1 })
        .limit(50);

    res.status(200).json({ success: true, count: orders.length, data: orders });
});

module.exports = { getAssignedOrders, updateDeliveryStatus, getDeliveryHistory };
