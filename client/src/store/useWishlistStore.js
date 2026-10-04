import { create } from 'zustand';
import API from '../config/api';

/**
 * useWishlistStore — server-synced wishlist (industry standard — works across devices).
 *
 * Call fetch() once on login. Uses a Set for O(1) isWishlisted() checks.
 * All toggle operations are optimistic (instant UI) then synced to server.
 */
const useWishlistStore = create((set, get) => ({
    items: [],          // Full product objects populated from server
    ids: new Set(),     // productId strings for fast lookup
    loading: false,
    fetched: false,     // Guard against double-fetching

    // Fetch from server — call once on login
    fetch: async () => {
        if (get().fetched) return;
        set({ loading: true });
        try {
            const { data } = await API.get('/wishlist');
            const products = (data.data?.productIds || []).filter(Boolean);
            const ids = new Set(products.map(p =>
                typeof p === 'string' ? p : p._id?.toString()
            ));
            set({ items: products, ids, fetched: true });
        } catch {
            // Non-critical — silently fail
        } finally {
            set({ loading: false });
        }
    },

    // Optimistic toggle
    toggle: async (product) => {
        const id = product._id?.toString() || product?.toString();
        const already = get().ids.has(id);

        // Immediate local update
        const newIds = new Set(get().ids);
        if (already) {
            newIds.delete(id);
            set({ ids: newIds, items: get().items.filter(p => (p._id?.toString() || p?.toString()) !== id) });
        } else {
            newIds.add(id);
            set({ ids: newIds, items: [...get().items, product] });
        }

        // Sync to server
        try {
            if (already) {
                await API.post('/wishlist/remove', { productId: id });
            } else {
                await API.post('/wishlist/add', { productId: id });
            }
        } catch {
            // Roll back on server error
            const rollback = new Set(get().ids);
            if (already) {
                rollback.add(id);
                set({ ids: rollback, items: [...get().items, product] });
            } else {
                rollback.delete(id);
                set({ ids: rollback, items: get().items.filter(p => (p._id?.toString() || p?.toString()) !== id) });
            }
        }
    },

    isWishlisted: (productId) => get().ids.has(productId?.toString()),

    clear: () => set({ items: [], ids: new Set(), fetched: false }),
}));

export default useWishlistStore;
