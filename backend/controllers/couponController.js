const asyncHandler = require('express-async-handler');
const Coupon = require('../models/Coupon');

// @desc    Create a new coupon
// @route   POST /api/coupons
// @access  Private/Vendor or Admin
const createCoupon = asyncHandler(async (req, res) => {
    const { code, discountType, discountValue, minOrderAmount, maxDiscountAmount, expirationDate, usageLimit, storeId } = req.body;

    // Vendors can only create coupons for their own store
    const targetStoreId = req.user.role === 'vendor' ? req.user.vendorId : storeId;

    if (!targetStoreId) {
        res.status(400);
        throw new Error('Store ID is required');
    }

    const couponExists = await Coupon.findOne({ code: code.toUpperCase(), storeId: targetStoreId });
    if (couponExists) {
        res.status(400);
        throw new Error('Coupon code already exists for this store');
    }

    const coupon = await Coupon.create({
        code: code.toUpperCase(),
        storeId: targetStoreId,
        discountType,
        discountValue,
        minOrderAmount,
        maxDiscountAmount,
        expirationDate,
        usageLimit,
        createdBy: req.user._id
    });

    res.status(201).json({ success: true, data: coupon });
});

// @desc    Get coupons (vendor sees own store, admin sees all)
// @route   GET /api/coupons
// @access  Private/Vendor or Admin
const getCoupons = asyncHandler(async (req, res) => {
    let filter = {};
    if (req.user.role === 'vendor') {
        filter.storeId = req.user.vendorId;
    }
    const coupons = await Coupon.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: coupons.length, data: coupons });
});

// @desc    Get active coupons for a store (public for customer display)
// @route   GET /api/coupons/store/:storeId
// @access  Public
const getStoreCoupons = asyncHandler(async (req, res) => {
    const coupons = await Coupon.find({
        storeId: req.params.storeId,
        isActive: true,
        expirationDate: { $gt: new Date() }
    }).select('code discountType discountValue minOrderAmount').sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: coupons.length, data: coupons });
});

// @desc    Validate and apply coupon
// @route   POST /api/coupons/validate
// @access  Private (Customer)
const validateCoupon = asyncHandler(async (req, res) => {
    const { code, orderAmount, storeId } = req.body;

    const filter = { code: code.toUpperCase(), isActive: true };
    if (storeId) filter.storeId = storeId;

    const coupon = await Coupon.findOne(filter);

    if (!coupon) {
        res.status(404);
        throw new Error('Invalid or expired coupon code');
    }

    if (new Date() > coupon.expirationDate) {
        res.status(400);
        throw new Error('Coupon has expired');
    }

    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
        res.status(400);
        throw new Error('Coupon usage limit reached');
    }

    if (orderAmount < coupon.minOrderAmount) {
        res.status(400);
        throw new Error(`Minimum order amount of ₹${coupon.minOrderAmount} required`);
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
        discount = (orderAmount * coupon.discountValue) / 100;
        if (coupon.maxDiscountAmount) {
            discount = Math.min(discount, coupon.maxDiscountAmount);
        }
    } else {
        discount = coupon.discountValue;
    }
    discount = Math.min(discount, orderAmount);

    res.status(200).json({
        success: true,
        data: {
            couponCode: coupon.code,
            discountAmount: discount,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue
        }
    });
});

// @desc    Delete coupon
// @route   DELETE /api/coupons/:id
// @access  Private/Vendor (own) or Admin
const deleteCoupon = asyncHandler(async (req, res) => {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
        res.status(404);
        throw new Error('Coupon not found');
    }

    // Vendors can only delete their own store's coupons
    if (req.user.role === 'vendor' && coupon.storeId?.toString() !== req.user.vendorId?.toString()) {
        res.status(403);
        throw new Error('Not authorized to delete this coupon');
    }

    await coupon.deleteOne();
    res.status(200).json({ success: true, message: 'Coupon removed' });
});

module.exports = {
    createCoupon,
    getCoupons,
    getStoreCoupons,
    validateCoupon,
    deleteCoupon
};
