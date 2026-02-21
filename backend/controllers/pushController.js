const asyncHandler = require('express-async-handler');
const webpush = require('web-push');
const User = require('../models/User');

// Setup web-push (graceful — server won't crash if VAPID keys are missing)
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        `mailto:${process.env.SUPPORT_EMAIL || 'admin@mubarak.com'}`,
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
} else {
    console.warn('⚠️  VAPID keys not set — push notifications disabled. Run: npx web-push generate-vapid-keys');
}

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

// Utility to send push to a specific user (no HTTP req needed)
const sendPushNotification = async (userId, payload) => {
    try {
        const user = await User.findById(userId);
        if (!user || !user.pushSubscription) return false;

        await webpush.sendNotification(user.pushSubscription, JSON.stringify(payload));
        return true;
    } catch (error) {
        console.error(`Error pushing to user ${userId}:`, error.message);
        if (error.statusCode === 410 || error.statusCode === 404) {
            // Subscription has expired or is no longer valid
            await User.updateOne({ _id: userId }, { $set: { pushSubscription: null } });
        }
        return false;
    }
};

module.exports = { subscribeUser, sendPushNotification };
