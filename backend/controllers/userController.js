const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id); // FIX: Actually fetch the user
    if (user) {
        res.json({ success: true, data: user });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Get all users (admin only)
// @route   GET /api/users/all
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.role) filter.role = req.query.role;

    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, data: users });
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        if (req.body.phone) {
            user.phone = req.body.phone; // Assuming phone field exists or needs to be added to schema
        }

        if (req.body.password) {
            user.password = req.body.password; // Will be hashed by pre-save hook
        }

        const updatedUser = await user.save();

        res.json({
            success: true,
            data: {
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                phone: updatedUser.phone,
                role: updatedUser.role,
                deliveryPin: updatedUser.deliveryPin,
            },
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Add a delivery address
// @route   POST /api/users/addresses
// @access  Private
const addAddress = asyncHandler(async (req, res) => {
    const { label, name, phone, flat, building, area, landmark, city, state, pincode, address, fullAddress, location } = req.body;

    const user = await User.findById(req.user._id);

    if (user) {
        const composedAddress = fullAddress || address || [flat, building, area, landmark, city, state, pincode].filter(Boolean).join(', ');

        const newAddress = {
            label: label || 'Home',
            name: name || user.name || '',
            phone: phone || user.phone || '',
            flat: flat || '',
            building: building || '',
            area: area || '',
            landmark: landmark || '',
            city: city || '',
            state: state || '',
            pincode: pincode || '',
            fullAddress: composedAddress,
            lat: location?.lat || null,
            lng: location?.lng || null,
        };

        if (!user.savedAddresses) {
            user.savedAddresses = [];
        }

        // If label is Home or Work, remove existing ones to prevent duplicates
        if (newAddress.label === 'Home' || newAddress.label === 'Work') {
            user.savedAddresses = user.savedAddresses.filter(addr => addr.label !== newAddress.label);
        }

        // Prevent spamming "Current Location" from App.jsx auto-save
        if (newAddress.label === 'Current Location') {
            const existingCurrent = user.savedAddresses.find(addr => addr.label === 'Current Location');
            if (existingCurrent) {
                // Just update the existing one
                existingCurrent.fullAddress = newAddress.fullAddress;
                existingCurrent.lat = newAddress.lat;
                existingCurrent.lng = newAddress.lng;
                await user.save();
                return res.status(200).json({ success: true, data: user.savedAddresses });
            }
        }

        user.savedAddresses.push(newAddress);
        await user.save();

        res.status(201).json({ success: true, data: user.savedAddresses });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Get all addresses
// @route   GET /api/users/addresses
// @access  Private
const getAddresses = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (user) {
        res.json({ success: true, data: user.savedAddresses || [] });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Delete an address
// @route   DELETE /api/users/addresses/:id
// @access  Private
const deleteAddress = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        if (!user.savedAddresses) {
            res.status(404);
            throw new Error('No addresses found');
        }

        user.savedAddresses = user.savedAddresses.filter(
            (addr) => addr._id.toString() !== req.params.id
        );

        await user.save();
        res.json({ success: true, data: user.savedAddresses });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

module.exports = {
    getUserProfile,
    updateUserProfile,
    addAddress,
    getAddresses,
    deleteAddress,
    getUsers
};
