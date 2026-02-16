import { create } from 'zustand';

const useCartStore = create((set, get) => ({
    items: JSON.parse(localStorage.getItem('mubarak_cart')) || [],
    storeId: localStorage.getItem('mubarak_storeId') || null,

    // Add item to cart
    addItem: (product) => {
        const items = get().items;
        const existing = items.find((i) => i.productId === product._id);

        let newItems;
        if (existing) {
            newItems = items.map((i) =>
                i.productId === product._id ? { ...i, quantity: i.quantity + 1 } : i
            );
        } else {
            newItems = [
                ...items,
                {
                    productId: product._id,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                    weightLabel: product.weightLabel,
                    selectedCut: product.cutOptions?.[0] || '',
                    quantity: 1,
                },
            ];
        }

        localStorage.setItem('mubarak_cart', JSON.stringify(newItems));
        localStorage.setItem('mubarak_storeId', product.storeId);
        set({ items: newItems, storeId: product.storeId });
    },

    // Remove item (decrease quantity or remove)
    removeItem: (productId) => {
        const items = get().items;
        const existing = items.find((i) => i.productId === productId);

        if (!existing) return;

        let newItems;
        if (existing.quantity === 1) {
            newItems = items.filter((i) => i.productId !== productId);
        } else {
            newItems = items.map((i) =>
                i.productId === productId ? { ...i, quantity: i.quantity - 1 } : i
            );
        }

        localStorage.setItem('mubarak_cart', JSON.stringify(newItems));
        if (newItems.length === 0) localStorage.removeItem('mubarak_storeId');
        set({ items: newItems, storeId: newItems.length > 0 ? get().storeId : null });
    },

    // Update selected cut for an item
    updateCut: (productId, cut) => {
        const items = get().items.map((i) =>
            i.productId === productId ? { ...i, selectedCut: cut } : i
        );
        localStorage.setItem('mubarak_cart', JSON.stringify(items));
        set({ items });
    },

    // Get item count for a specific product
    getItemCount: (productId) => {
        const item = get().items.find((i) => i.productId === productId);
        return item ? item.quantity : 0;
    },

    // Total items count
    getTotalCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

    // Total price
    getTotalPrice: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

    // Clear cart
    clearCart: () => {
        localStorage.removeItem('mubarak_cart');
        localStorage.removeItem('mubarak_storeId');
        set({ items: [], storeId: null });
    },
}));

export default useCartStore;
