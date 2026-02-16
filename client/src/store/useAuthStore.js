import { create } from 'zustand';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import API from '../config/api';

const useAuthStore = create((set) => ({
    user: JSON.parse(localStorage.getItem('mubarak_user')) || null,
    token: localStorage.getItem('mubarak_token') || null,
    loading: false,
    error: null,

    // Google Sign-In
    loginWithGoogle: async () => {
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
            set({ error: error.response?.data?.error?.message || error.message, loading: false });
            throw error;
        }
    },

    // Logout
    logout: () => {
        localStorage.removeItem('mubarak_token');
        localStorage.removeItem('mubarak_user');
        set({ user: null, token: null });
    },

    // Clear error
    clearError: () => set({ error: null }),
}));

export default useAuthStore;
