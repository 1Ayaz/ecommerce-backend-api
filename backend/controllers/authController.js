const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// In-memory OTP store (dev only — production would use Redis/Meta WhatsApp API)
const otpStore = new Map();

// Generate JWT tokens
const generateAccessToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
};

const generateRefreshToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

// @desc    Send OTP (mock — logs to console for dev)
// @route   POST /api/auth/send-otp
// @access  Public
const sendOtp = asyncHandler(async (req, res) => {
    const { phone } = req.body;

    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
        res.status(400);
        throw new Error('Valid 10-digit Indian mobile number required');
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP with 5-min TTL
    otpStore.set(`otp:${phone}`, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });

    // Log to console (dev mock — production would use Meta WhatsApp API)
    console.log(`\n📱 OTP for ${phone}: ${otp}\n`);

    res.status(200).json({
        success: true,
        message: 'OTP sent successfully',
        // Include OTP in dev mode for testing convenience
        ...(process.env.NODE_ENV !== 'production' && { devOtp: otp }),
    });
});

// @desc    Verify OTP and Login/Register
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOtp = asyncHandler(async (req, res) => {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
        res.status(400);
        throw new Error('Phone and OTP are required');
    }

    const stored = otpStore.get(`otp:${phone}`);

    if (!stored || stored.otp !== otp) {
        res.status(401);
        throw new Error('Invalid OTP');
    }

    if (Date.now() > stored.expiresAt) {
        otpStore.delete(`otp:${phone}`);
        res.status(401);
        throw new Error('OTP expired. Please request a new one.');
    }

    // Clear used OTP
    otpStore.delete(`otp:${phone}`);

    // Find or create user
    let user = await User.findOne({ phone });

    if (!user) {
        user = await User.create({
            phone,
            isVerified: true,
            role: 'customer',
        });
    } else {
        user.isVerified = true;
        await user.save();
    }

    // Generate JWTs
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    // Set refresh token in HttpOnly cookie
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
        success: true,
        token: accessToken,
        user: {
            _id: user._id,
            name: user.name || '',
            phone: user.phone,
            role: user.role,
        },
    });
});

// @desc    Google Sign-In via Firebase (optional secondary method)
// @route   POST /api/auth/google
// @access  Public
const googleSignIn = asyncHandler(async (req, res) => {
    const { idToken } = req.body;

    if (!idToken) {
        res.status(400);
        throw new Error('Firebase ID token is required');
    }

    // Lazy-load firebase admin (only when Google auth is used)
    let admin;
    try {
        admin = require('../config/firebase');
    } catch (err) {
        res.status(500);
        throw new Error('Firebase not configured on server');
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name, picture } = decodedToken;

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

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
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
        user: { _id: user._id, name: user.name, email: user.email, role: user.role },
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

module.exports = { sendOtp, verifyOtp, googleSignIn, adminLogin, getMe, refreshAccessToken };
