// firebase-messaging-sw.js — Background message handler for FCM web push
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyCIzJ6QoLN-Zx_DWA_iA1ZdqJKO2Glje94",
    authDomain: "mubarak-fresh-chicken.firebaseapp.com",
    projectId: "mubarak-fresh-chicken",
    storageBucket: "mubarak-fresh-chicken.firebasestorage.app",
    messagingSenderId: "43887751317",
    appId: "1:43887751317:web:14c0c4f996813f804ceb9c"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Background message:', payload);

    const title = payload.notification?.title || payload.data?.title || 'Mubarak Fresh Chicken';
    const body = payload.notification?.body || payload.data?.body || 'You have a new notification.';

    self.registration.showNotification(title, {
        body,
        icon: '/vite.svg',
        badge: '/vite.svg',
        data: payload.data,
        vibrate: [200, 100, 200],
    });
});

// Handle notification click — open or focus the app
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            if (clientList.length > 0) {
                return clientList[0].focus();
            }
            return clients.openWindow('/');
        })
    );
});
