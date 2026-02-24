import { create } from 'zustand';

const useCartStore = create((set, get) => ({
    items: JSON.parse(localStorage.getItem('mubarak_cart')) || [],
    vendorId: localStorage.getItem('mubarak_vendorId') || null,

    // Add item to cart (product + variation — no cut selection)
    addItem: (product, variation) => {
        let items = get().items;
        const variationLabel = variation.label;
        const price = variation.discountedPrice || variation.price || variation.basePrice;

        // Multi-Vendor Fix: Identify if the incoming product belongs to a new vendor
        const itemVendorId = product.vendorId || product.storeId;
        const existingVendorId = get().vendorId || localStorage.getItem('mubarak_vendorId');

        // If cart is not empty and the vendor changed, wipe the cart
        if (items.length > 0 && itemVendorId && existingVendorId && itemVendorId !== existingVendorId) {
            items = [];
        }

        const activeVendorId = itemVendorId || existingVendorId;

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
                    vendorId: activeVendorId,
                },
            ];
        }

        localStorage.setItem('mubarak_cart', JSON.stringify(newItems));
        if (activeVendorId) {
            localStorage.setItem('mubarak_vendorId', activeVendorId);
        }
        set({ items: newItems, vendorId: activeVendorId });
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
