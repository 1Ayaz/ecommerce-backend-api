import API from '../config/api';

const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
};

export const subscribeToPushNotifications = async () => {
    if (!('serviceWorker' in navigator)) {
        console.warn("Service Workers are not supported in this browser");
        return;
    }
    if (!('PushManager' in window)) {
        console.warn("Push API is not supported in this browser");
        return;
    }

    try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.warn("Push notification permission not granted");
            return;
        }

        // Must register explicitly, otherwise .ready hangs indefinitely if no SW exists
        let registration;
        try {
            registration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker registered successfully:', registration.scope);
        } catch (swErr) {
            console.error('Service Worker registration failed:', swErr);
            return;
        }

        registration = await navigator.serviceWorker.ready;
        let subscription = await registration.pushManager.getSubscription();

        // If not subscribed, subscribe using VAPID key
        if (!subscription) {
            const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

            // If the VAPID key is missing from environment, abort safely
            if (!vapidPublicKey) {
                console.warn("VITE_VAPID_PUBLIC_KEY missing. Push notifications disabled.");
                return;
            }

            const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedVapidKey
            });
            console.log('Successfully subscribed to push notifications');
        }

        // Send subscription to backend
        await API.post('/users/subscribe', { subscription });
        console.log('✅ Push notifications subscribed successfully');

    } catch (error) {
        console.error('Failed to subscribe to push notifications:', error);
    }
};
