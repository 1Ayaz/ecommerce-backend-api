const asyncHandler = require('express-async-handler');
const AuthService = require('../services/AuthService');
const User = require('../models/User');

// @desc    Google Sign-In via Firebase
// @route   POST /api/auth/google
const googleSignIn = asyncHandler(async (req, res) => {
    const { idToken } = req.body;
    const result = await AuthService.googleSignIn(idToken);

    res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
        success: true,
        token: result.accessToken,
        user: result.user
    });
});

// @desc    Admin login (email/password)
// @route   POST /api/auth/admin-login
const adminLogin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await AuthService.adminLogin(email, password);

    res.status(200).json({
        success: true,
        token: result.accessToken,
        user: result.user
    });
});

// @desc    Get current user profile
const getMe = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('-password').populate('vendorId');
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Auto-migrate legacy customers to have a Delivery PIN
    if (user.role === 'customer' && !user.deliveryPin) {
        user.deliveryPin = Math.floor(1000 + Math.random() * 9000).toString();
        await user.save();
    }

    res.status(200).json({ success: true, data: user });
});

// @desc    Get all users (Admin only, Vendors see their drivers)
const getUsers = asyncHandler(async (req, res) => {
    let query = {};
    if (req.user.role === 'vendor') {
        // Vendors only see drivers assigned to their store
        // Assuming driver's vendorId matches the vendor's vendorId (Store ID)
        // Note: req.user.vendorId is the Store ObjectId for the vendor user
        query = { role: 'driver', vendorId: req.user.vendorId };
    }

    const users = await User.find(query).select('-password');
    res.status(200).json({ success: true, count: users.length, data: users });
});

// @desc    Create a user (Admin only — for Vendors/Drivers)
const createUser = asyncHandler(async (req, res) => {
    if (req.user.role === 'vendor') {
        req.body.role = 'driver';
        req.body.vendorId = req.user.vendorId;
        req.body.storeId = req.user.vendorId;
    }
    const user = await AuthService.createUser(req.body);
    res.status(201).json({ success: true, data: user });
});

// @desc    Delete user
const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }
    if (req.user.role === 'vendor') {
        if (user.role !== 'driver' || user.vendorId?.toString() !== req.user.vendorId?.toString()) {
            res.status(403);
            throw new Error('Not authorized to delete this user');
        }
    }
    await user.deleteOne();
    res.status(200).json({ success: true, message: 'User removed' });
});

// @desc    Refresh access token
const refreshAccessToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
        res.status(401);
        throw new Error('Refresh token not found');
    }
    const result = await AuthService.refreshAccessToken(refreshToken);
    res.status(200).json({ success: true, token: result.accessToken });
});

// @desc    Register a new vendor and create their store (Admin Only)
const registerVendor = asyncHandler(async (req, res) => {
    const { name, email, password, businessName, location, address, serviceArea } = req.body;

    const Store = require('../models/Store');

    // Create Vendor User
    const user = await AuthService.createUser({
        name,
        email,
        password,
        role: 'vendor'
    });

    // Create Store
    const store = await Store.create({
        name: businessName || `${name}'s Store`,
        businessName: businessName || name,
        ownerId: user._id,
        location,
        address,
        serviceArea,
        isActive: true
    });

    // Link user to store
    user.vendorId = store._id;
    await user.save();

    res.status(201).json({
        success: true,
        data: {
            user,
            store
        }
    });
});

module.exports = {
    googleSignIn,
    adminLogin,
    registerVendor,
    getMe,
    refreshAccessToken,
    getUsers,
    createUser,
    deleteUser
};
