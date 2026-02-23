const admin = require('firebase-admin');

let firebaseInitialized = false;

try {
    const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    let serviceAccount = null;

    if (rawKey) {
        try {
            serviceAccount = JSON.parse(rawKey);
        } catch (parseErr) {
            console.warn('FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON. Ensure Render environment variables are set correctly.');
        }
    }

    if (serviceAccount) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        firebaseInitialized = true;
        console.log('Firebase Admin SDK initialized successfully via Environment Variable');
    } else {
        console.warn('Firebase Admin SDK disabled — no FIREBASE_SERVICE_ACCOUNT_KEY found.');
    }
} catch (err) {
    console.warn('Firebase Admin SDK failed to initialize:', err.message);
}

module.exports = admin;

