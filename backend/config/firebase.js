const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// For dev: use service account JSON
// For prod: use GOOGLE_APPLICATION_CREDENTIALS env var
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    : null;

if (serviceAccount) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
} else {
    // Fallback: try default credentials
    admin.initializeApp();
}

module.exports = admin;
