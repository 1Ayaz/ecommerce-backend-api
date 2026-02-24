const asyncHandler = require('express-async-handler');

// Ensure vendor/delivery can only access their own vendor's data
const restrictToOwnVendor = asyncHandler(async (req, res, next) => {
    const user = req.user;

    // Admin can access all vendors
    if (user.role === 'admin') {
        return next();
    }

    // Vendor and delivery must have a vendorId
    if (['vendor', 'driver'].includes(user.role)) {
        if (!user.vendorId) {
            res.status(403);
            throw new Error('User is not assigned to any vendor');
        }

        // Attach vendorId to request for easy access in controllers
        req.userVendorId = user.vendorId.toString();
        return next();
    }

    // Customers don't need vendor restriction
    next();
});

// Verify that the requested resource belongs to user's vendor
const verifyVendorOwnership = (resourceVendorIdField = 'vendorId') => {
    return asyncHandler(async (req, res, next) => {
        const user = req.user;

        // Admin bypass check
        if (user.role === 'admin') {
            return next();
        }

        // For vendor/driver, verify vendor ownership
        if (['vendor', 'driver'].includes(user.role)) {
            const resourceVendorId = req.params[resourceVendorIdField] || req.body[resourceVendorIdField];

            if (!resourceVendorId) {
                res.status(400);
                throw new Error('Vendor ID is required');
            }

            if (resourceVendorId.toString() !== user.vendorId.toString()) {
                res.status(403);
                throw new Error('Access denied: Resource belongs to different vendor');
            }
        }

        next();
    });
};

module.exports = { restrictToOwnVendor, verifyVendorOwnership };
