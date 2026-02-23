const admin = require("../config/firebase");

const sendNotification = async (token, title, body, data = {}) => {
    try {
        // If token is missing, skip quietly
        if (!token) return;

        const messagePayload = {
            token: token,
            notification: {
                title: title,
                body: body
            },
            data: {
                ...data,
                click_action: "FLUTTER_NOTIFICATION_CLICK" // Standard Flutter identifier
            },
            android: {
                priority: "high"
            },
            apns: {
                headers: {
                    "apns-priority": "10"
                },
                payload: {
                    aps: {
                        contentAvailable: true // Wakes iOS apps
                    }
                }
            }
        };

        await admin.messaging().send(messagePayload);
    } catch (err) {
        console.log("FCM Error:", err);
    }
};

module.exports = sendNotification;
