import { getMessaging, getToken } from 'firebase/messaging';
import app from '../config/firebase';
import API from '../config/api';

export const subscribeToPushNotifications = async () => {
    if (!('serviceWorker' in navigator)) {
        console.warn("Service Workers are not supported in this browser");
        return;
    }
    if (!('PushManager' in window)) {
        console.warn("Push API is not supported in this browser");
        return;
    }

    if (!app) {
        console.warn("Firebase app not initialized, cannot setup FCM");
        return;
    }

    try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.warn("Push notification permission not granted");
            return;
        }

        // Must register explicitly, otherwise FCM cannot find the SW scope easily
        let registration;
        try {
            registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
            console.log('Firebase Service Worker registered successfully:', registration.scope);
        } catch (swErr) {
            console.error('Service Worker registration failed:', swErr);
            return;
        }

        const messaging = getMessaging(app);
        const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

        if (!vapidPublicKey) {
            console.warn("VITE_VAPID_PUBLIC_KEY missing. Need FCM Web Push Certificate to generate token.");
            return;
        }

        const currentToken = await getToken(messaging, {
            vapidKey: vapidPublicKey,
            serviceWorkerRegistration: registration,
        });

        if (currentToken) {
            // Send FCM token to backend
            await API.post('/users/subscribe', {
                subscription: { type: 'fcm', token: currentToken }
            });
            console.log('✅ FCM Push notifications subscribed successfully');
        } else {
            console.warn('No registration token available. Request permission to generate one.');
        }

    } catch (error) {
        console.error('Failed to subscribe to push notifications:', error);
    }
};
