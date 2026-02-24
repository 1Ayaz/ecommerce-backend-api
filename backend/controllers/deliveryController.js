const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const User = require('../models/User');
const { emitToRoom } = require('../utils/socket');

// @desc    Get assigned orders for delivery boy
// @route   GET /api/delivery/orders
// @access  Private (Delivery)
const getAssignedOrders = asyncHandler(async (req, res) => {
    const deliveryBoy = req.user;

    const vendorId = deliveryBoy.vendorId || req.userVendorId;
    if (!vendorId) {
        res.status(403);
        throw new Error('Delivery boy is not assigned to any vendor');
    }

    const orders = await Order.find({
        driverId: deliveryBoy._id,
        vendorId,
        status: { $in: ['assigned', 'out_for_delivery'] },
    })
        .populate('customerId', 'name phone')
        .populate('vendorId', 'name address')
        .sort({ placedAt: -1 });

    res.status(200).json({ success: true, count: orders.length, data: orders });
});

// @desc    Update delivery status
// @route   PUT /api/delivery/orders/:id/status
const updateDeliveryStatus = asyncHandler(async (req, res) => {
    const { status, otp } = req.body;
    const deliveryBoy = req.user;

    const order = await Order.findOne({
        _id: req.params.id,
        driverId: deliveryBoy._id,
        vendorId: deliveryBoy.vendorId || req.userVendorId,
    }).populate('customerId', 'name phone deliveryPin');

    if (!order) {
        res.status(404);
        throw new Error('Order not found or not assigned to you');
    }

    // Strict state sequence: assigned -> out_for_delivery -> delivered
    const validNextStates = {
        'assigned': ['out_for_delivery'],
        'out_for_delivery': ['delivered']
    };

    if (!validNextStates[order.status]?.includes(status)) {
        res.status(400);
        throw new Error(`Invalid status transition. Cannot change from '${order.status}' to '${status}'.`);
    }

    // OTP validation for delivered
    if (status === 'delivered') {
        if (!otp) {
            res.status(400);
            throw new Error('Delivery PIN (OTP) is required to mark order as delivered');
        }

        // Strict comparison
        if (otp.toString() !== order.customerId.deliveryPin?.toString()) {
            res.status(400);
            throw new Error('Invalid Delivery PIN');
        }
    }
    const messages = {
        'out_for_delivery': 'Your delivery partner is on the way',
        'delivered': 'Order delivered successfully'
    };

    order.status = status;
    order.statusTimeline.push({
        status,
        message: messages[status] || `Status updated to ${status}`
    });

    const updated = await order.save();

    // Notify customer in real-time
    emitToRoom(order.customerId._id.toString(), 'order-update', {
        orderId: order._id,
        status,
        message: messages[status] || `Your order status has been updated`,
        statusTimeline: updated.statusTimeline
    });

    res.status(200).json({ success: true, data: updated });
});

// @desc    Get delivery history
// @route   GET /api/delivery/history
const getDeliveryHistory = asyncHandler(async (req, res) => {
    const deliveryBoy = req.user;

    const orders = await Order.find({
        driverId: deliveryBoy._id,
        status: 'delivered',
    })
        .populate('customerId', 'name phone')
        .populate('vendorId', 'name')
        .sort({ updatedAt: -1 })
        .limit(50);

    res.status(200).json({ success: true, count: orders.length, data: orders });
});

// @desc    Toggle online/offline status
// @route   PUT /api/delivery/online
const toggleOnline = asyncHandler(async (req, res) => {
    const deliveryBoy = req.user;
    deliveryBoy.isOnline = !deliveryBoy.isOnline;
    await deliveryBoy.save();

    res.status(200).json({ success: true, isOnline: deliveryBoy.isOnline });
});

// @desc    Get delivery earnings
// @route   GET /api/delivery/earnings
const getEarnings = asyncHandler(async (req, res) => {
    const deliveryBoy = req.user;

    // Start of today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Start of week (Sunday)
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());

    // Fetch all completed deliveries
    const deliveredOrders = await Order.find({
        driverId: deliveryBoy._id,
        status: 'delivered',
    });

    let todayDeliveries = 0;
    let todayEarnings = 0;
    let weeklyEarnings = 0;

    deliveredOrders.forEach(order => {
        // Use actual delivery boy fee from order (set by vendor in deliveryConfig)
        const fee = order.financialSnapshot?.deliveryBoyFee ?? 30;
        const deliveredDate = order.updatedAt;
        if (deliveredDate >= startOfToday) {
            todayDeliveries++;
            todayEarnings += fee;
        }
        if (deliveredDate >= startOfWeek) {
            weeklyEarnings += fee;
        }
    });

    res.status(200).json({
        success: true,
        data: {
            todayDeliveries,
            todayEarnings,
            weeklyEarnings
        }
    });
});

module.exports = {
    getAssignedOrders,
    updateDeliveryStatus,
    getDeliveryHistory,
    toggleOnline,
    getEarnings
};
