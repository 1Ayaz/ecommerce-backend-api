import { create } from 'zustand';
import API from '../config/api';

const STORAGE_KEY = 'mubarak_wishlist';

const useWishlistStore = create((set, get) => ({
    items: JSON.parse(localStorage.getItem(STORAGE_KEY)) || [],
    synced: false,

    // Toggle wishlist (add if not present, remove if present)
    toggle: async (productId) => {
        const items = get().items;
        const exists = items.includes(productId);
        let newItems;

        if (exists) {
            newItems = items.filter((id) => id !== productId);
        } else {
            newItems = [...items, productId];
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
        set({ items: newItems });

        // Sync with backend (fire & forget)
        try {
            if (exists) {
                await API.post('/wishlist/remove', { productId });
            } else {
                await API.post('/wishlist/add', { productId });
            }
        } catch {
            // silently fail — local state is source of truth for guests
        }
    },

    isWishlisted: (productId) => {
        return get().items.includes(productId);
    },

    // Sync local wishlist with API (call on login)
    sync: async () => {
        try {
            const res = await API.get('/wishlist');
            const apiItems = (res.data.data.productIds || []).map((p) =>
                typeof p === 'string' ? p : p._id
            );
            localStorage.setItem(STORAGE_KEY, JSON.stringify(apiItems));
            set({ items: apiItems, synced: true });
        } catch {
            // Keep local state
        }
    },

    clear: () => {
        localStorage.removeItem(STORAGE_KEY);
        set({ items: [], synced: false });
    },
}));

export default useWishlistStore;
