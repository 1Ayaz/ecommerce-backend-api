// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// TODO: Paste your Firebase config here from the console
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

try {
    // Only initialize if API Key is somewhat populated
    if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
        firebase.initializeApp(firebaseConfig);
        const messaging = firebase.messaging();

        messaging.onBackgroundMessage((payload) => {
            console.log('[firebase-messaging-sw.js] Received background message ', payload);

            const notificationTitle = payload.notification?.title || 'Notification';
            const notificationOptions = {
                body: payload.notification?.body || 'You have a new update.',
                icon: '/vite.svg', // Update icon path as needed
                data: payload.data
            };

            self.registration.showNotification(notificationTitle, notificationOptions);
        });
    }
} catch (e) {
    console.log("Firebase SW init failed:", e);
}
