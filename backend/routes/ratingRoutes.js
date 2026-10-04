const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Rating = require('../models/Rating');
const Order = require('../models/Order');
const { protect, authorize } = require('../middleware/authMiddleware');
const { body, validationResult } = require('express-validator');

// POST /api/ratings — Submit a rating (customer only, order must be delivered, not already rated)
router.post('/',
    protect,
    authorize('customer'),
    [
        body('orderId').isMongoId().withMessage('Invalid order ID'),
        body('productId').isMongoId().withMessage('Invalid product ID'),
        body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
        body('comment').optional().isLength({ max: 300 }).withMessage('Comment too long'),
    ],
    asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400);
            throw new Error(errors.array().map(e => e.msg).join(', '));
        }

        const { orderId, productId, rating, comment } = req.body;

        // Verify the order belongs to this customer and is delivered
        const order = await Order.findById(orderId);
        if (!order) { res.status(404); throw new Error('Order not found'); }
        if (order.customerId.toString() !== req.user._id.toString()) {
            res.status(403); throw new Error('Not authorized');
        }
        if (order.status !== 'delivered') {
            res.status(400); throw new Error('You can only rate delivered orders');
        }

        // Check not already rated
        const existing = await Rating.findOne({ orderId });
        if (existing) { res.status(400); throw new Error('You have already rated this order'); }

        const newRating = await Rating.create({
            orderId,
            productId,
            customerId: req.user._id,
            vendorId: order.vendorId,
            rating,
            comment: comment || '',
        });

        res.status(201).json({ success: true, data: newRating });
    })
);

// GET /api/ratings/product/:productId — Public: get ratings for a product (last 20)
router.get('/product/:productId', asyncHandler(async (req, res) => {
    const ratings = await Rating.find({ productId: req.params.productId })
        .populate('customerId', 'name')
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();

    const avg = ratings.length
        ? (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length)
        : 0;

    res.json({
        success: true,
        data: { ratings, averageRating: Math.round(avg * 10) / 10, count: ratings.length }
    });
}));

// GET /api/ratings/store/:storeId — Public: get ratings for a store
router.get('/store/:storeId', asyncHandler(async (req, res) => {
    const ratings = await Rating.find({ vendorId: req.params.storeId })
        .populate('customerId', 'name')
        .populate('productId', 'name image')
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

    const avg = ratings.length
        ? (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length)
        : 0;

    res.json({
        success: true,
        data: { ratings, averageRating: Math.round(avg * 10) / 10, count: ratings.length }
    });
}));

// GET /api/ratings/check/:orderId — Customer: check if order is already rated
router.get('/check/:orderId', protect, asyncHandler(async (req, res) => {
    const rating = await Rating.findOne({
        orderId: req.params.orderId,
        customerId: req.user._id
    }).lean();
    res.json({ success: true, data: { rated: !!rating, rating } });
}));

module.exports = router;
