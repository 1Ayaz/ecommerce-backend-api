import { getMessaging, getToken } from 'firebase/messaging';
import app from '../config/firebase';
import API from '../config/api';
import { toast } from 'react-toastify';

export const subscribeToPushNotifications = async () => {
    if (!('serviceWorker' in navigator)) return;
    if (!('PushManager' in window)) return;
    if (!app) return;

    try {
        // Check if notifications are blocked before even asking
        if (Notification.permission === 'denied') {
            toast.warn('🔔 Notifications are blocked. Enable them in your browser settings to receive order alerts.', {
                toastId: 'notif-blocked', // prevent duplicate toasts
                autoClose: 8000,
            });
            return;
        }

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            if (permission === 'denied') {
                toast.warn('🔔 Notifications blocked. Go to your browser settings → Site permissions → Notifications → Allow for this site.', {
                    toastId: 'notif-blocked',
                    autoClose: 8000,
                });
            }
            return;
        }

        let registration;
        try {
            registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        } catch (swErr) {
            console.error('Service Worker registration failed:', swErr);
            return;
        }

        const messaging = getMessaging(app);
        const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

        if (!vapidPublicKey) {
            console.warn('VITE_VAPID_PUBLIC_KEY missing.');
            return;
        }

        const currentToken = await getToken(messaging, {
            vapidKey: vapidPublicKey,
            serviceWorkerRegistration: registration,
        });

        if (currentToken) {
            await API.post('/users/subscribe', {
                subscription: { type: 'fcm', token: currentToken }
            });
            console.log('✅ FCM Push notifications subscribed successfully');
        }

    } catch (error) {
        // Only log — don't show an error toast for FCM failures (non-actionable for the user)
        console.error('Failed to subscribe to push notifications:', error);
    }
};
