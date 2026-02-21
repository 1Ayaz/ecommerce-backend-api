const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
    imageUrl: { type: String, required: true },
    linkUrl: { type: String, default: '' },
    title: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 }
}, { _id: true });

const settingsSchema = new mongoose.Schema({
    siteName: {
        type: String,
        default: 'Mubarak Fresh Chicken'
    },
    supportEmail: {
        type: String,
        default: 'support@example.com'
    },
    supportPhone: {
        type: String,
        default: ''
    },

    // NOTE: Delivery pricing is store-specific (Store.deliveryConfig)
    // No platform-level delivery fee or threshold


    // ─── Financial Configuration ───────────────────────────────────────────
    taxRate: {
        type: Number,
        default: 0,          // Percentage e.g. 5 = 5%
        min: 0,
        max: 100
    },
    platformServiceFee: {
        type: Number,
        default: 0,          // Flat fee added to every order by platform
    },
    commissionPercentage: {
        type: Number,
        default: 0,          // % of order total taken by platform from vendor
        min: 0,
        max: 100
    },

    // ─── Payment Method Control ────────────────────────────────────────────
    // Admin toggles which methods are available for checkout.
    // Backend validates method against these flags before accepting an order.
    paymentMethods: {
        codEnabled: { type: Boolean, default: true },   // Cash on Delivery
        mockUpiEnabled: { type: Boolean, default: true },   // Fake UPI for testing (auto-confirms)
        upiEnabled: { type: Boolean, default: false },   // Real UPI gateway
        cardEnabled: { type: Boolean, default: false },   // Cards
        walletEnabled: { type: Boolean, default: false },   // Wallet
    },

    // ─── System Flags ─────────────────────────────────────────────────────
    maintenanceMode: {
        type: Boolean,
        default: false
    },
    allowRegistrations: {
        type: Boolean,
        default: true
    },

    // ─── Admin Branding ───────────────────────────────────────────────────
    logoUrl: {
        type: String,
        default: ''
    },
    banners: {
        type: [bannerSchema],
        default: []
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Settings', settingsSchema);

