const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const admin = require('../config/firebase');

// @desc    Save Push Subscription for a User
// @route   POST /api/users/subscribe
// @access  Private
const subscribeUser = asyncHandler(async (req, res) => {
    const { subscription } = req.body;

    if (!subscription) {
        res.status(400);
        throw new Error('No push subscription provided');
    }

    const user = await User.findById(req.user._id);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    user.pushSubscription = subscription;
    await user.save();

    res.status(200).json({ success: true, message: 'Push subscription saved successfully' });
});

// Utility to send push to a specific user using FCM
const sendPushNotification = async (userId, payload) => {
    try {
        const user = await User.findById(userId);
        if (!user || !user.pushSubscription || user.pushSubscription.type !== 'fcm') {
            return false;
        }

        // Validate payload structure
        const message = {
            notification: {
                title: payload.title || 'New update',
                body: payload.body || ''
            },
            data: payload.data || {},
            token: user.pushSubscription.token
        };

        const response = await admin.messaging().send(message);
        console.log(`Successfully sent message to user ${userId}:`, response);
        return true;
    } catch (error) {
        console.error(`Error pushing to user ${userId} via FCM:`, error.message);

        // Remove stale/invalid tokens automatically
        if (
            error.code === 'messaging/invalid-registration-token' ||
            error.code === 'messaging/registration-token-not-registered'
        ) {
            await User.updateOne({ _id: userId }, { $set: { pushSubscription: null } });
        }
        return false;
    }
};

module.exports = { subscribeUser, sendPushNotification };
