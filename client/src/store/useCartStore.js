import { create } from 'zustand';

const useCartStore = create((set, get) => ({
    items: JSON.parse(localStorage.getItem('mubarak_cart')) || [],
    vendorId: localStorage.getItem('mubarak_vendorId') || null,

    // Add item to cart (product + variation — no cut selection)
    addItem: (product, variation) => {
        const items = get().items;
        const variationLabel = variation.label;
        const price = variation.discountedPrice || variation.price || variation.basePrice;
        // VendorId: from product, from existing cart items, or from localStorage
        const currentVendorId = product.vendorId || product.storeId || get().vendorId || localStorage.getItem('mubarak_vendorId');

        const cartKey = `${product._id}_${variationLabel}`;
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
                    variationLabel,
                    name: product.name,
                    price,
                    image: product.image,
                    weightLabel: variationLabel,
                    quantity: 1,
                    vendorId: currentVendorId,
                },
            ];
        }

        localStorage.setItem('mubarak_cart', JSON.stringify(newItems));
        // Only update vendorId if we have a real value
        if (currentVendorId) {
            localStorage.setItem('mubarak_vendorId', currentVendorId);
        }
        set({ items: newItems, vendorId: currentVendorId || get().vendorId });
    },

    // Remove item
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
        if (newItems.length === 0) {
            localStorage.removeItem('mubarak_vendorId');
            set({ items: newItems, vendorId: null });
        } else {
            set({ items: newItems });
        }
    },

    // Get item count for a specific variation
    getItemCount: (productId, variationLabel) => {
        const cartKey = `${productId}_${variationLabel}`;
        const item = get().items.find((i) => i.cartKey === cartKey);
        return item ? item.quantity : 0;
    },

    getTotalCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

    getTotalPrice: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

    clearCart: () => {
        localStorage.removeItem('mubarak_cart');
        localStorage.removeItem('mubarak_vendorId');
        set({ items: [], vendorId: null });
    },
}));

export default useCartStore;
