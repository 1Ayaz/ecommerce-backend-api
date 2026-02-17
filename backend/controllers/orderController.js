const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Store = require('../models/Store');

// @desc    Place a new order
// @route   POST /api/orders
// @access  Private (Customer)
const placeOrder = asyncHandler(async (req, res) => {
    const { storeId, items, deliveryAddress, paymentMethod, specialInstructions } = req.body;

    // Validate required fields
    if (!storeId) {
        res.status(400);
        throw new Error('Store ID is required');
    }

    if (!deliveryAddress || !deliveryAddress.fullAddress) {
        res.status(400);
        throw new Error('Delivery address is required');
    }

    if (!items || items.length === 0) {
        res.status(400);
        throw new Error('No items in order');
    }

    // Verify store exists and is open
    const store = await Store.findById(storeId);
    if (!store) {
        res.status(404);
        throw new Error('Store not found');
    }

    if (!store.isOpen) {
        res.status(400);
        throw new Error('Store is currently closed');
    }

    // Validate & recalculate prices from DB
    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
        // Validate quantity
        if (!item.quantity || item.quantity < 1 || item.quantity > 99) {
            res.status(400);
            throw new Error('Invalid quantity. Must be between 1 and 99');
        }

        const product = await Product.findById(item.productId);

        if (!product) {
            res.status(400);
            throw new Error(`Product ${item.productId} not found`);
        }

        // Verify product belongs to the selected store
        if (product.storeId.toString() !== storeId) {
            res.status(400);
            throw new Error(`Product ${product.name} does not belong to selected store`);
        }

        // Find the specific variant
        const variant = product.variants.find((v) => v.weight === item.variantWeight);

        if (!variant || !variant.inStock) {
            res.status(400);
            throw new Error(`Variant ${item.variantWeight} for ${product.name} is unavailable`);
        }

        const itemTotal = variant.price * item.quantity;
        totalAmount += itemTotal;

        validatedItems.push({
            productId: product._id,
            variantId: variant._id,
            name: product.name,
            price: variant.price,
            quantity: item.quantity,
            selectedCut: item.selectedCut || '',
            image: product.image,
        });
    }

    const order = await Order.create({
        customerId: req.user._id,
        storeId,
        items: validatedItems,
        totalAmount,
        deliveryAddress,
        paymentMethod: paymentMethod || 'COD',
        specialInstructions: specialInstructions || '',
        status: 'placed',
    });

    res.status(201).json({ success: true, data: order });
});

// @desc    Get order history for logged-in customer
// @route   GET /api/orders/history
// @access  Private (Customer)
const getOrderHistory = asyncHandler(async (req, res) => {
    const orders = await Order.find({ customerId: req.user._id })
        .populate('storeId', 'name')
        .sort({ placedAt: -1 });

    res.status(200).json({ success: true, count: orders.length, data: orders });
});

// @desc    Get single order details
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id)
        .populate('storeId', 'name')
        .populate('customerId', 'name phone');

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    // Verify user has access to this order
    if (
        req.user.role === 'customer' &&
        order.customerId._id.toString() !== req.user._id.toString()
    ) {
        res.status(403);
        throw new Error('Not authorized to view this order');
    }

    res.status(200).json({ success: true, data: order });
});

// @desc    Update order status (vendor/admin)
// @route   PUT /api/orders/:id/status
// @access  Private (Vendor/Admin)
const updateOrderStatus = asyncHandler(async (req, res) => {
    const { status, driverId } = req.body;

    // Validate status
    const validStatuses = ['placed', 'accepted', 'cutting', 'ready', 'out', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
        res.status(400);
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    order.status = status;
    if (driverId) order.driverId = driverId;

    const updated = await order.save();
    res.status(200).json({ success: true, data: updated });
});

// @desc    Get orders for vendor's store
// @route   GET /api/orders/vendor/store-orders
// @access  Private (Vendor)
const getStoreOrders = asyncHandler(async (req, res) => {
    const vendor = req.user;

    if (!vendor.storeId) {
        res.status(403);
        throw new Error('Vendor is not assigned to any store');
    }

    const { status } = req.query;
    const filter = { storeId: vendor.storeId };

    if (status) {
        filter.status = status;
    }

    const orders = await Order.find(filter)
        .populate('customerId', 'name phone')
        .populate('driverId', 'name phone')
        .sort({ placedAt: -1 });

    res.status(200).json({ success: true, count: orders.length, data: orders });
});

// @desc    Assign delivery boy to order
// @route   PUT /api/orders/:id/assign-driver
// @access  Private (Vendor)
const assignDriver = asyncHandler(async (req, res) => {
    const { driverId } = req.body;
    const vendor = req.user;

    if (!driverId) {
        res.status(400);
        throw new Error('Driver ID is required');
    }

    const order = await Order.findOne({
        _id: req.params.id,
        storeId: vendor.storeId,
    });

    if (!order) {
        res.status(404);
        throw new Error('Order not found in your store');
    }

    // Verify driver belongs to same store
    const driver = await require('../models/User').findOne({
        _id: driverId,
        role: 'driver',
        storeId: vendor.storeId,
    });

    if (!driver) {
        res.status(400);
        throw new Error('Driver not found or does not belong to your store');
    }

    order.driverId = driverId;
    if (order.status === 'placed') {
        order.status = 'accepted';
    }

    const updated = await order.save();
    res.status(200).json({ success: true, data: updated });
});

module.exports = {
    placeOrder,
    getOrderHistory,
    getOrderById,
    updateOrderStatus,
    getStoreOrders,
    assignDriver,
};
