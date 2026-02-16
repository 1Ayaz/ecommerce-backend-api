const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const admin = require('../config/firebase');
const User = require('../models/User');

// Generate JWT tokens
const generateAccessToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
};

const generateRefreshToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

// @desc    Google Sign-In via Firebase
// @route   POST /api/auth/google
// @access  Public
const googleSignIn = asyncHandler(async (req, res) => {
    const { idToken } = req.body;

    if (!idToken) {
        res.status(400);
        throw new Error('Firebase ID token is required');
    }

    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name, picture } = decodedToken;

    // Find or create user
    let user = await User.findOne({ firebaseUid: uid });

    if (!user) {
        user = await User.create({
            firebaseUid: uid,
            email,
            name: name || email.split('@')[0],
            photoURL: picture || '',
            isVerified: true,
            role: 'customer',
        });
    }

    // Generate app JWT
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    // Set refresh token in HttpOnly cookie
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
        success: true,
        token: accessToken,
        user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            photoURL: user.photoURL,
        },
    });
});

// @desc    Admin login (email/password)
// @route   POST /api/auth/admin-login
// @access  Public
const adminLogin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (!user || !['admin', 'vendor'].includes(user.role)) {
        res.status(401);
        throw new Error('Invalid credentials');
    }

    const bcrypt = require('bcryptjs');
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        res.status(401);
        throw new Error('Invalid credentials');
    }

    const accessToken = generateAccessToken(user._id, user.role);

    res.status(200).json({
        success: true,
        token: accessToken,
        user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        },
    });
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    res.status(200).json({ success: true, user });
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public (cookie)
const refreshAccessToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
        res.status(401);
        throw new Error('No refresh token');
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
        res.status(401);
        throw new Error('User not found');
    }

    const accessToken = generateAccessToken(user._id, user.role);
    res.status(200).json({ success: true, token: accessToken });
});

module.exports = { googleSignIn, adminLogin, getMe, refreshAccessToken };
