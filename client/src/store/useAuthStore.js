import { create } from 'zustand';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword } from '../config/firebase';
import API from '../config/api';

const useAuthStore = create((set) => ({
    user: JSON.parse(localStorage.getItem('mubarak_user')) || null,
    token: localStorage.getItem('mubarak_token') || null,
    loading: false,
    error: null,

    // Google Sign-In (Popup flow)
    loginWithGoogle: async () => {
        if (!auth || !googleProvider) {
            set({ error: 'Firebase not configured. Add VITE_FIREBASE_* keys to client/.env' });
            throw new Error('Firebase not configured');
        }

        set({ loading: true, error: null });
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const idToken = await result.user.getIdToken();
            const { data } = await API.post('/auth/google', { idToken });

            localStorage.setItem('mubarak_token', data.token);
            localStorage.setItem('mubarak_user', JSON.stringify(data.user));

            set({ user: data.user, token: data.token, loading: false });
            return data;
        } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    // Handle Redirect Result (Deprecated/No-op since using Popup)
    handleRedirectResult: async () => {
        // No-op
        return;
    },

    // Firebase Email/Password Sign-In
    loginWithEmail: async (email, password) => {
        if (!auth) {
            set({ error: 'Firebase not configured. Add VITE_FIREBASE_* keys to client/.env' });
            throw new Error('Firebase not configured');
        }

        set({ loading: true, error: null });
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            const idToken = await result.user.getIdToken();

            const { data } = await API.post('/auth/google', { idToken });

            localStorage.setItem('mubarak_token', data.token);
            localStorage.setItem('mubarak_user', JSON.stringify(data.user));

            set({ user: data.user, token: data.token, loading: false });
            return data;
        } catch (error) {
            const code = error.code;
            const messages = {
                'auth/invalid-credential': 'Invalid email or password',
                'auth/user-not-found': 'No account found with this email',
                'auth/wrong-password': 'Incorrect password',
                'auth/too-many-requests': 'Too many attempts. Try again later',
                'auth/invalid-email': 'Invalid email address',
            };
            const msg = messages[code] || error.response?.data?.error?.message || error.message;
            set({ error: msg, loading: false });
            throw error;
        }
    },

    // Firebase Email/Password Sign-Up
    signUpWithEmail: async (email, password) => {
        if (!auth) {
            set({ error: 'Firebase not configured. Add VITE_FIREBASE_* keys to client/.env' });
            throw new Error('Firebase not configured');
        }

        set({ loading: true, error: null });
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            const idToken = await result.user.getIdToken();

            const { data } = await API.post('/auth/google', { idToken });

            localStorage.setItem('mubarak_token', data.token);
            localStorage.setItem('mubarak_user', JSON.stringify(data.user));

            set({ user: data.user, token: data.token, loading: false });
            return data;
        } catch (error) {
            const code = error.code;
            const messages = {
                'auth/email-already-in-use': 'An account with this email already exists',
                'auth/weak-password': 'Password must be at least 6 characters',
                'auth/invalid-email': 'Invalid email address',
            };
            const msg = messages[code] || error.response?.data?.error?.message || error.message;
            set({ error: msg, loading: false });
            throw error;
        }
    },

    // Admin/Vendor Login (email + password)
    adminLogin: async (email, password) => {
        set({ loading: true, error: null });
        try {
            const { data } = await API.post('/auth/admin-login', { email, password });

            localStorage.setItem('mubarak_token', data.token);
            localStorage.setItem('mubarak_user', JSON.stringify(data.user));

            set({ user: data.user, token: data.token, loading: false });

            // Redirect based on role
            if (['admin', 'vendor'].includes(data.user.role)) {
                window.location.href = '/dashboard';
            } else if (data.user.role === 'driver') {
                window.location.href = '/delivery';
            }

            return data;
        } catch (error) {
            const msg = error.response?.data?.error?.message || error.message;
            set({ error: msg, loading: false });
            throw error;
        }
    },

    // Fetch fresh profile from API
    fetchProfile: async () => {
        try {
            const { data } = await API.get('/users/profile');
            const freshUser = data.data;
            localStorage.setItem('mubarak_user', JSON.stringify(freshUser));
            set({ user: freshUser });
            return freshUser;
        } catch (error) {
            console.error('Failed to fetch profile:', error);
            // If 401, token is invalid — clear auth
            if (error.response?.status === 401) {
                localStorage.removeItem('mubarak_token');
                localStorage.removeItem('mubarak_user');
                set({ user: null, token: null });
            }
            return null;
        }
    },

    // Logout
    logout: () => {
        localStorage.removeItem('mubarak_token');
        localStorage.removeItem('mubarak_user');
        localStorage.removeItem('userLocation');
        set({ user: null, token: null });
    },

    clearError: () => set({ error: null }),
}));

export default useAuthStore;
