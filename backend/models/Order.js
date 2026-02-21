const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
    {
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        vendorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Store',
            required: true,
        },
        driverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        items: [
            {
                productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
                name: String,
                variationLabel: String,
                selectedCut: String,
                price: Number,     // Snapshotted at order creation — never changes
                quantity: Number,
            },
        ],

        // ─── Financial Snapshot ────────────────────────────────────────────
        // All values are locked at the time of order creation.
        // Changing vendor prices, delivery slabs, or tax rates MUST NOT
        // affect this record. This is the single source of financial truth.
        financialSnapshot: {
            itemsTotal: { type: Number, required: true },  // Sum of item prices
            deliveryFee: { type: Number, default: 0 },      // From Store.deliveryConfig slab
            platformFee: { type: Number, default: 0 },      // Platform service fee (future)
            taxAmount: { type: Number, default: 0 },      // Tax calculated from Settings.taxRate
            discountAmount: { type: Number, default: 0 },      // Coupon discount applied
            deliveryBoyFee: { type: Number, default: 0 },       // Amount payable to delivery boy
            commissionAmount: { type: Number, default: 0 },     // Platform commission from this order
            grandTotal: { type: Number, required: true },  // Final amount charged
        },

        // Kept for backwards compatibility during migration
        subTotal: { type: Number },
        discountAmount: { type: Number, default: 0 },
        couponCode: { type: String, default: null },
        totalAmount: { type: Number, required: true },     // = financialSnapshot.grandTotal

        deliveryAddress: {
            type: Object,
            required: true,
        },
        paymentMethod: {
            type: String,
            // Values controlled by Settings.paymentMethods toggles
            enum: ['COD', 'MOCK_UPI', 'UPI', 'CARD', 'WALLET'],
            default: 'COD',
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'failed', 'refunded'],
            default: 'pending',
        },
        status: {
            type: String,
            enum: [
                'placed',
                'accepted',
                'assigned',
                'picked_up',
                'out_for_delivery',
                'delivered',
                'cancelled',
                'refunded',
            ],
            default: 'placed',
        },
        specialInstructions: {
            type: String,
            default: '',
        },
        statusTimeline: [
            {
                status: { type: String, required: true },
                timestamp: { type: Date, default: Date.now },
                message: String,
            },
        ],
        placedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

// ─── Status Transition Guard ────────────────────────────────────────────────
// Defines allowed forward-only transitions to prevent skipping or reverting
orderSchema.statics.ALLOWED_TRANSITIONS = {
    placed: ['accepted', 'cancelled'],
    accepted: ['assigned', 'cancelled'],
    assigned: ['picked_up', 'out_for_delivery', 'cancelled'],
    picked_up: ['out_for_delivery', 'cancelled'],
    out_for_delivery: ['delivered'],
    delivered: ['refunded'],
    cancelled: [],
    refunded: [],
};

orderSchema.index({ customerId: 1 });
orderSchema.index({ vendorId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ driverId: 1 });

module.exports = mongoose.model('Order', orderSchema);

