const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// Protect routes - verify JWT
const protect = asyncHandler(async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

            // Find user and verify they still exist
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                res.status(401);
                throw new Error('User no longer exists');
            }

            return next();
        } catch (error) {
            res.status(401);
            throw new Error('Not authorized, token failed');
        }
    }

    if (!token) {
        res.status(401);
        throw new Error('Not authorized, no token');
    }
});

// Role-based authorization
const authorize = (...roles) => {
    return asyncHandler((req, res, next) => {
        if (!req.user) {
            res.status(401);
            throw new Error('Not authenticated');
        }

        if (roles.includes(req.user.role)) {
            return next();
        }

        res.status(403);
        throw new Error(`Role '${req.user.role}' is not authorized to access this route`);
    });
};

module.exports = { protect, authorize };
