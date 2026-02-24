const express = require('express');
const router = express.Router();
const {
    googleSignIn,
    adminLogin,
    registerVendor,
    getMe,
    refreshAccessToken,
    getUsers,
    createUser,
    deleteUser
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { validateLoginCredentials, validateUserCreation, validateMongoId } = require('../middleware/validation');

// Google OAuth
router.post('/google', googleSignIn);

// Admin/Vendor Login
router.post('/admin-login', validateLoginCredentials, adminLogin);

// Admin Only
router.post('/register-vendor', protect, authorize('admin'), registerVendor);

// Protected
router.get('/me', protect, getMe);
router.post('/refresh', refreshAccessToken);

// Admin Only - User management
router.get('/users', protect, authorize('admin', 'vendor'), getUsers);
router.post('/users', protect, authorize('admin', 'vendor'), validateUserCreation, createUser);
router.delete('/users/:id', protect, authorize('admin', 'vendor'), validateMongoId, deleteUser);

module.exports = router;
