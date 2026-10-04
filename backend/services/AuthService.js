const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

class AuthService {
    /**
     * Generate Access and Refresh Tokens
     */
    static generateTokens(user) {
        const accessToken = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_ACCESS_SECRET,
            { expiresIn: '1d' }
        );
        const refreshToken = jwt.sign(
            { id: user._id },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '7d' }
        );
        return { accessToken, refreshToken };
    }

    /**
     * Firebase Sign In / Registration
     */
    static async googleSignIn(idToken) {
        const admin = require('../config/firebase');
        let decodedToken;

        try {
            decodedToken = await admin.auth().verifyIdToken(idToken);
        } catch (error) {
            throw new ApiError(401, 'Invalid Firebase ID token');
        }

        const { uid, email, name, picture, phone_number } = decodedToken;

        let user;

        // Try to find user by firebaseUid first
        user = await User.findOne({ firebaseUid: uid });

        // If not found by UID, but we have a phone number, try to find by phone
        if (!user && phone_number) {
            user = await User.findOne({ phone: phone_number });
            if (user) {
                // Link the new firebaseUid to this existing user
                user.firebaseUid = uid;
                await user.save();
            }
        }

        if (!user) {
            user = await User.create({
                firebaseUid: uid,
                email: email || '',
                phone: phone_number || '',
                name: name || (email ? email.split('@')[0] : (phone_number || 'User')),
                photoURL: picture || '',
                isVerified: true,
                role: 'customer',
            });
        }

        return {
            user,
            ...this.generateTokens(user)
        };
    }

    /**
     * Administrative Login (Email/Password)
     */
    static async adminLogin(email, password) {
        const user = await User.findOne({ email }).select('+password');

        if (!user || !['admin', 'vendor', 'driver'].includes(user.role)) {
            throw new ApiError(401, 'Invalid credentials');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new ApiError(401, 'Invalid credentials');
        }

        return {
            user,
            ...this.generateTokens(user)
        };
    }

    /**
     * Create User (Admin Only)
     */
    static async createUser(userData) {
        const { email, phone, password } = userData;

        // Validate required fields for account creation
        if (!password) {
            throw new ApiError(400, 'Password is required');
        }

        const userExists = await User.findOne({ $or: [{ email }, { phone }] });
        if (userExists) {
            throw new ApiError(400, 'User already exists with this email or phone');
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            ...userData,
            vendorId: userData.storeId || userData.vendorId, // Frontend sends storeId
            password: hashedPassword,
            isVerified: true
        });

        return user;
    }

    /**
     * Refresh Access Token
     */
    static async refreshAccessToken(refreshToken) {
        try {
            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
            const user = await User.findById(decoded.id);
            if (!user) throw new ApiError(401, 'User not found');

            return this.generateTokens(user);
        } catch (error) {
            throw new ApiError(401, 'Invalid refresh token');
        }
    }

    /**
     * Send WhatsApp OTP to a phone number
     */
    static async sendOTP(phone) {
        const { generateOTP, saveOTP } = require('../utils/otpStore');
        const { sendWhatsAppMessage } = require('../utils/whatsapp');

        // Normalize: strip everything except digits
        const normalizedPhone = phone.replace(/\D/g, '');
        if (normalizedPhone.length < 10) {
            throw new ApiError(400, 'Invalid phone number. Must be at least 10 digits.');
        }

        const otp = generateOTP();
        saveOTP(normalizedPhone, otp);

        const message = `Your The Fresh Cuts verification code is: *${otp}*\n\nThis code expires in 5 minutes. Do not share it with anyone.`;
        await sendWhatsAppMessage(normalizedPhone, message);

        return { success: true, phone: normalizedPhone };
    }

    /**
     * Verify OTP and login/register the user
     */
    static async verifyOTP(phone, otp, name) {
        const { verifyOTP: checkOTP } = require('../utils/otpStore');

        const normalizedPhone = phone.replace(/\D/g, '');
        const result = checkOTP(normalizedPhone, otp);

        if (!result.valid) {
            throw new ApiError(400, result.reason);
        }

        // Find existing user by phone, or auto-register
        let user = await User.findOne({ phone: normalizedPhone });
        if (!user) {
            user = await User.create({
                phone: normalizedPhone,
                name: name || `User${normalizedPhone.slice(-4)}`,
                role: 'customer',
                isVerified: true,
            });
        } else {
            if (!user.isVerified) {
                user.isVerified = true;
                await user.save();
            }
        }

        return {
            user,
            ...this.generateTokens(user)
        };
    }
}

module.exports = AuthService;
