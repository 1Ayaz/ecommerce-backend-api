const admin = require('firebase-admin');
const logger = require('../utils/logger');

// Initialize Firebase Admin SDK
let firebaseInitialized = false;

try {
    const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    let serviceAccount = null;

    if (rawKey) {
        try {
            serviceAccount = JSON.parse(rawKey);
        } catch (parseErr) {
            logger.warn('FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON — falling back to default credentials. Google Sign-In will not work until a valid key is provided.');
        }
    }

    if (serviceAccount) {
        admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    } else {
        admin.initializeApp();
    }
    firebaseInitialized = true;
} catch (err) {
    logger.warn('Firebase Admin SDK failed to initialize — Google Sign-In disabled:', err.message);
}

module.exports = admin;

