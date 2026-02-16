const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Product = require('../models/Product');

// @desc    Place a new order
// @route   POST /api/orders
// @access  Private (Customer)
const placeOrder = asyncHandler(async (req, res) => {
    const { storeId, items, deliveryAddress, paymentMethod, specialInstructions } = req.body;

    if (!items || items.length === 0) {
        res.status(400);
        throw new Error('No items in order');
    }

    // Validate & recalculate prices from DB
    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
        const product = await Product.findById(item.productId);

        if (!product || !product.inStock) {
            res.status(400);
            throw new Error(`Product ${item.productId} is unavailable`);
        }

        const itemTotal = product.price * item.quantity;
        totalAmount += itemTotal;

        validatedItems.push({
            productId: product._id,
            name: product.name,
            price: product.price,
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

    res.status(200).json({ success: true, data: order });
});

// @desc    Update order status (vendor/admin)
// @route   PUT /api/orders/:id/status
// @access  Private (Vendor/Admin)
const updateOrderStatus = asyncHandler(async (req, res) => {
    const { status, driverId } = req.body;

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

module.exports = { placeOrder, getOrderHistory, getOrderById, updateOrderStatus };
