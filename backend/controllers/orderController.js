const asyncHandler = require('express-async-handler');
const OrderService = require('../services/OrderService');

// @desc    Place a new order
// @route   POST /api/orders
const placeOrder = asyncHandler(async (req, res) => {
    // Only customers can place orders
    if (req.user.role !== 'customer') {
        res.status(403);
        throw new Error('Only customers can place orders');
    }
    const order = await OrderService.placeOrder(req.body, req.user._id);
    res.status(201).json({ success: true, data: order });
});

// @desc    Get all orders (admin only)
// @route   GET /api/orders
const getAllOrders = asyncHandler(async (req, res) => {
    const Order = require('../models/Order');
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status && req.query.status !== 'all') {
        filter.status = req.query.status;
    }

    const [orders, total] = await Promise.all([
        Order.find(filter)
            .populate('customerId', 'name email phone')
            .populate('vendorId', 'name')
            .populate('driverId', 'name phone')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Order.countDocuments(filter),
    ]);

    res.status(200).json({
        success: true,
        count: orders.length,
        total,
        page,
        pages: Math.ceil(total / limit),
        data: orders,
    });
});

// @desc    Get order history for logged-in customer
// @route   GET /api/orders/history
const getOrderHistory = asyncHandler(async (req, res) => {
    const Order = require('../models/Order'); // Still need for lean query here
    const orders = await Order.find({ customerId: req.user._id })
        .populate('vendorId', 'name')
        .sort({ placedAt: -1 });
    res.status(200).json({ success: true, count: orders.length, data: orders });
});

// @desc    Get single order details
// @route   GET /api/orders/:id
const getOrderById = asyncHandler(async (req, res) => {
    const Order = require('../models/Order');
    const order = await Order.findById(req.params.id)
        .populate('vendorId', 'name')
        .populate('customerId', 'name phone deliveryPin');

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    if (req.user.role === 'customer' && order.customerId._id.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to view this order');
    }

    res.status(200).json({ success: true, data: order });
});

// @desc    Update order status (vendor/admin)
// @route   PUT /api/orders/:id/status
const updateOrderStatus = asyncHandler(async (req, res) => {
    const { status, driverId } = req.body;
    const updated = await OrderService.updateStatus(req.params.id, status, driverId, req.user);
    res.status(200).json({ success: true, data: updated });
});

// @desc    Get vendor-specific orders
// @route   GET /api/orders/vendor/orders
const getVendorOrders = asyncHandler(async (req, res) => {
    const orders = await OrderService.getVendorOrders(
        req.userVendorId || req.user.vendorId,
        req.query.status
    );
    res.status(200).json({ success: true, count: orders.length, data: orders });
});

// @desc    Assign driver to order
// @route   PUT /api/orders/:id/assign-driver
const assignDriver = asyncHandler(async (req, res) => {
    const order = await OrderService.updateStatus(
        req.params.id,
        'assigned', // Start of delivery lifecycle
        req.body.driverId,
        req.user
    );
    res.status(200).json({ success: true, data: order });
});

module.exports = {
    placeOrder,
    getAllOrders,
    getOrderHistory,
    getOrderById,
    updateOrderStatus,
    getVendorOrders,
    assignDriver,
};
