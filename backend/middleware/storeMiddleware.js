const asyncHandler = require('express-async-handler');

// Ensure vendor/delivery can only access their own store's data
const restrictToOwnStore = asyncHandler(async (req, res, next) => {
    const user = req.user;

    // Admin can access all stores
    if (user.role === 'admin') {
        return next();
    }

    // Vendor and delivery must have a storeId
    if (['vendor', 'driver'].includes(user.role)) {
        if (!user.storeId) {
            res.status(403);
            throw new Error('User is not assigned to any store');
        }

        // Attach storeId to request for easy access in controllers
        req.userStoreId = user.storeId.toString();
        return next();
    }

    // Customers don't need store restriction
    next();
});

// Verify that the requested resource belongs to user's store
const verifyStoreOwnership = (resourceStoreIdField = 'storeId') => {
    return asyncHandler(async (req, res, next) => {
        const user = req.user;

        // Admin bypasses check
        if (user.role === 'admin') {
            return next();
        }

        // For vendor/driver, verify store ownership
        if (['vendor', 'driver'].includes(user.role)) {
            const resourceStoreId = req.params[resourceStoreIdField] || req.body[resourceStoreIdField];

            if (!resourceStoreId) {
                res.status(400);
                throw new Error('Store ID is required');
            }

            if (resourceStoreId !== user.storeId.toString()) {
                res.status(403);
                throw new Error('Access denied: Resource belongs to different store');
            }
        }

        next();
    });
};

module.exports = { restrictToOwnStore, verifyStoreOwnership };
