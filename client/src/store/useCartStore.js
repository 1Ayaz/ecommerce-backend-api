import { create } from 'zustand';

const useCartStore = create((set, get) => ({
    items: JSON.parse(localStorage.getItem('mubarak_cart')) || [],
    storeId: localStorage.getItem('mubarak_storeId') || null,

    // Add item to cart (from Home or PDP with variant and selectedCut)
    addItem: (product, variant, selectedCut = '') => {
        const items = get().items;
        const cartKey = `${product._id}_${variant._id}_${selectedCut || 'default'}`;
        const existing = items.find((i) => i.cartKey === cartKey);

        let newItems;
        if (existing) {
            newItems = items.map((i) =>
                i.cartKey === cartKey ? { ...i, quantity: i.quantity + 1 } : i
            );
        } else {
            newItems = [
                ...items,
                {
                    cartKey,
                    productId: product._id,
                    variantId: variant._id,
                    name: product.name,
                    price: variant.price,
                    image: product.image,
                    weightLabel: variant.weight,
                    selectedCut,
                    quantity: 1,
                    storeId: product.storeId,
                },
            ];
        }

        localStorage.setItem('mubarak_cart', JSON.stringify(newItems));
        localStorage.setItem('mubarak_storeId', product.storeId);
        set({ items: newItems, storeId: product.storeId });
    },

    // Remove item (decrease quantity or remove)
    removeItem: (cartKey) => {
        const items = get().items;
        const existing = items.find((i) => i.cartKey === cartKey);

        if (!existing) return;

        let newItems;
        if (existing.quantity === 1) {
            newItems = items.filter((i) => i.cartKey !== cartKey);
        } else {
            newItems = items.map((i) =>
                i.cartKey === cartKey ? { ...i, quantity: i.quantity - 1 } : i
            );
        }

        localStorage.setItem('mubarak_cart', JSON.stringify(newItems));
        if (newItems.length === 0) localStorage.removeItem('mubarak_storeId');
        set({ items: newItems, storeId: newItems.length > 0 ? get().storeId : null });
    },

    // Get item count for a specific variant + cut
    getItemCount: (productId, variantId, selectedCut = '') => {
        const cartKey = `${productId}_${variantId}_${selectedCut || 'default'}`;
        const item = get().items.find((i) => i.cartKey === cartKey);
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
