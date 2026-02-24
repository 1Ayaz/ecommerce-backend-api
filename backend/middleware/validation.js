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

// Order validation rules — aligned with frontend (vendorId, variationLabel)
const validateOrderCreation = [
    body('vendorId').notEmpty().withMessage('Vendor ID is required').isMongoId().withMessage('Invalid vendor ID'),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.productId').isMongoId().withMessage('Invalid product ID'),
    body('items.*.variationLabel').notEmpty().withMessage('Variation label is required'),
    body('items.*.quantity')
        .isInt({ min: 1, max: 99 })
        .withMessage('Quantity must be between 1 and 99'),
    body('deliveryAddress.fullAddress').notEmpty().withMessage('Delivery address is required'),
    body('deliveryAddress.lat').optional({ nullable: true }).isFloat().withMessage('Invalid latitude'),
    body('deliveryAddress.lng').optional({ nullable: true }).isFloat().withMessage('Invalid longitude'),
    body('paymentMethod')
        .optional()
        .isIn(['COD', 'ONLINE'])
        .withMessage('Invalid payment method'),
    handleValidationErrors,
];

// Login credentials validation
const validateLoginCredentials = [
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

// Order status validation — must match Order model enum exactly
const validateOrderStatus = [
    body('status')
        .isIn(['accepted', 'assigned', 'out_for_delivery', 'delivered', 'cancelled'])
        .withMessage('Invalid order status'),
    handleValidationErrors,
];

// Product validation — aligned with new schema (variations with label/basePrice/desc)
const validateProduct = [
    body('name').notEmpty().withMessage('Product name is required'),
    body('categoryId').isMongoId().withMessage('Invalid category ID'),
    body('variations').isArray({ min: 1 }).withMessage('At least one variation is required'),
    body('variations.*.label').notEmpty().withMessage('Variation label is required'),
    body('variations.*.basePrice').isFloat({ min: 0 }).withMessage('Base price must be 0 or more'),
    handleValidationErrors,
];

// Store validation
const validateStore = [
    body('name').notEmpty().withMessage('Store name is required'),
    body('servicePincodes').optional().isArray().withMessage('Service pincodes must be an array'),
    body('phone').optional().matches(/^[6-9]\d{9}$/).withMessage('Valid phone number required'),
    handleValidationErrors,
];

// Admin user creation validation
const validateUserCreation = [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').optional().matches(/^[6-9]\d{9}$/).withMessage('Valid 10-digit Indian mobile number required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['admin', 'vendor', 'driver']).withMessage('Invalid role'),
    body('storeId').optional().isMongoId().withMessage('Invalid store ID'),
    handleValidationErrors,
];

module.exports = {
    validateOrderCreation,
    validateLoginCredentials,
    validateMongoId,
    validateStoreNearby,
    validateOrderStatus,
    validateProduct,
    validateStore,
    validateUserCreation,
    handleValidationErrors,
};
