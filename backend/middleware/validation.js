const { body, param, query, validationResult } = require('express-validator');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400);
        throw new Error(errors.array().map((e) => e.msg).join(', '));
    }
    next();
};

// Order validation rules
const validateOrderCreation = [
    body('storeId').notEmpty().withMessage('Store ID is required').isMongoId().withMessage('Invalid store ID'),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.productId').isMongoId().withMessage('Invalid product ID'),
    body('items.*.variantWeight').notEmpty().withMessage('Variant weight is required'),
    body('items.*.quantity')
        .isInt({ min: 1, max: 99 })
        .withMessage('Quantity must be between 1 and 99'),
    body('deliveryAddress.fullAddress').notEmpty().withMessage('Delivery address is required'),
    body('deliveryAddress.lat').optional().isFloat().withMessage('Invalid latitude'),
    body('deliveryAddress.lng').optional().isFloat().withMessage('Invalid longitude'),
    body('paymentMethod')
        .optional()
        .isIn(['COD', 'POD_QR', 'ONLINE'])
        .withMessage('Invalid payment method'),
    handleValidationErrors,
];

// Phone validation
const validatePhone = [
    body('phone')
        .matches(/^[6-9]\d{9}$/)
        .withMessage('Valid 10-digit Indian mobile number required'),
    handleValidationErrors,
];

// OTP validation
const validateOTP = [
    body('phone')
        .matches(/^[6-9]\d{9}$/)
        .withMessage('Valid 10-digit Indian mobile number required'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
    handleValidationErrors,
];

// Email validation
const validateEmail = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    handleValidationErrors,
];

// MongoDB ID validation
const validateMongoId = [param('id').isMongoId().withMessage('Invalid ID'), handleValidationErrors];

// Store nearby validation
const validateStoreNearby = [
    query('lat').optional().isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
    query('lng').optional().isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
    query('pincode').optional().isLength({ min: 6, max: 6 }).withMessage('Invalid pincode'),
    handleValidationErrors,
];

// Order status validation
const validateOrderStatus = [
    body('status')
        .isIn(['placed', 'accepted', 'rejected', 'cutting', 'ready', 'out', 'delivered', 'cancelled'])
        .withMessage('Invalid order status'),
    handleValidationErrors,
];

module.exports = {
    validateOrderCreation,
    validatePhone,
    validateOTP,
    validateEmail,
    validateMongoId,
    validateStoreNearby,
    validateOrderStatus,
    handleValidationErrors,
};
