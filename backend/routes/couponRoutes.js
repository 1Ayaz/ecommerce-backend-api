const express = require('express');
const router = express.Router();
const {
    createCoupon,
    getCoupons,
    getStoreCoupons,
    validateCoupon,
    deleteCoupon
} = require('../controllers/couponController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public: get active coupons for a store (customer display)
router.get('/store/:storeId', getStoreCoupons);

// Customer validation route
router.post('/validate', protect, validateCoupon);

// Vendor-only routes (coupons are store-specific)
router.route('/')
    .get(protect, authorize('vendor'), getCoupons)
    .post(protect, authorize('vendor'), createCoupon);

router.route('/:id')
    .delete(protect, authorize('vendor'), deleteCoupon);

module.exports = router;
