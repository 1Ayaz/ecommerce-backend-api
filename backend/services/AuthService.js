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
}

module.exports = AuthService;
