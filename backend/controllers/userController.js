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

// @desc    Save FCM Token
// @route   POST /api/users/fcm-token
// @access  Private
const saveFcmToken = asyncHandler(async (req, res) => {
    const { token } = req.body;

    await User.findByIdAndUpdate(req.user._id, {
        fcmToken: token
    });

    res.json({ success: true });
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

        const newLabel = (newAddress.label || 'Home').toLowerCase();

        // 1 Home only, 1 Work only
        if (newLabel === 'home' || newLabel === 'work') {
            const exists = user.savedAddresses.find(addr => (addr.label || '').toLowerCase() === newLabel);
            if (exists) {
                return res.status(400).json({
                    message: `${newLabel === 'home' ? 'Home' : 'Work'} address already exists`
                });
            }
        }

        // Prevent spamming "Current Location" from App.jsx auto-save
        if (newLabel === 'current location') {
            const existingCurrent = user.savedAddresses.find(addr => (addr.label || '').toLowerCase() === 'current location');
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

// @desc    Update an address
// @route   PUT /api/users/addresses/:id
// @access  Private
const updateAddress = asyncHandler(async (req, res) => {
    const { label, name, phone, flat, building, area, landmark, city, state, pincode, address, fullAddress, location } = req.body;
    const addressId = req.params.id;
    const user = await User.findById(req.user._id);

    if (user) {
        const addressToUpdate = user.savedAddresses.id(addressId);
        if (!addressToUpdate) {
            res.status(404);
            throw new Error('Address not found');
        }

        const newLabel = (label || addressToUpdate.label || 'home').toLowerCase();

        if (newLabel === 'home' || newLabel === 'work') {
            const exists = user.savedAddresses.find(
                addr => (addr.label || '').toLowerCase() === newLabel && addr._id.toString() !== addressId
            );

            if (exists) {
                return res.status(400).json({
                    message: `${newLabel} already exists`
                });
            }
        }

        addressToUpdate.label = label || addressToUpdate.label;
        addressToUpdate.name = name || addressToUpdate.name;
        addressToUpdate.phone = phone || addressToUpdate.phone;
        addressToUpdate.flat = flat || addressToUpdate.flat;
        addressToUpdate.building = building || addressToUpdate.building;
        addressToUpdate.area = area || addressToUpdate.area;
        addressToUpdate.landmark = landmark || addressToUpdate.landmark;
        addressToUpdate.city = city || addressToUpdate.city;
        addressToUpdate.state = state || addressToUpdate.state;
        addressToUpdate.pincode = pincode || addressToUpdate.pincode;
        addressToUpdate.fullAddress = fullAddress || address || addressToUpdate.fullAddress;
        if (location?.lat) addressToUpdate.lat = location.lat;
        if (location?.lng) addressToUpdate.lng = location.lng;

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
    saveFcmToken,
    addAddress,
    getAddresses,
    updateAddress,
    deleteAddress,
    getUsers
};
