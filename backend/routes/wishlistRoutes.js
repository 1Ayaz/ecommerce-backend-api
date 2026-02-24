const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Wishlist = require('../models/Wishlist');
const { protect } = require('../middleware/authMiddleware');

// @desc    Get current user's wishlist
// @route   GET /api/wishlist
router.get('/', protect, asyncHandler(async (req, res) => {
    let wishlist = await Wishlist.findOne({ userId: req.user._id }).populate('productIds');
    if (!wishlist) {
        wishlist = { userId: req.user._id, productIds: [] };
    }
    res.status(200).json({ success: true, data: wishlist });
}));

// @desc    Add product to wishlist
// @route   POST /api/wishlist/add
router.post('/add', protect, asyncHandler(async (req, res) => {
    const { productId } = req.body;
    if (!productId) {
        res.status(400);
        throw new Error('productId is required');
    }

    let wishlist = await Wishlist.findOne({ userId: req.user._id });
    if (!wishlist) {
        wishlist = await Wishlist.create({ userId: req.user._id, productIds: [productId] });
    } else if (!wishlist.productIds.includes(productId)) {
        wishlist.productIds.push(productId);
        await wishlist.save();
    }

    res.status(200).json({ success: true, data: wishlist });
}));

// @desc    Remove product from wishlist
// @route   POST /api/wishlist/remove
router.post('/remove', protect, asyncHandler(async (req, res) => {
    const { productId } = req.body;
    if (!productId) {
        res.status(400);
        throw new Error('productId is required');
    }

    const wishlist = await Wishlist.findOne({ userId: req.user._id });
    if (wishlist) {
        wishlist.productIds = wishlist.productIds.filter(
            (id) => id.toString() !== productId
        );
        await wishlist.save();
    }

    res.status(200).json({ success: true, data: wishlist || { userId: req.user._id, productIds: [] } });
}));

module.exports = router;
