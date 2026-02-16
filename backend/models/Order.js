const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
    {
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        storeId: {
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
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product',
                },
                variantId: {
                    type: mongoose.Schema.Types.ObjectId,
                },
                name: String,
                price: Number,
                quantity: Number,
                selectedCut: String,
                image: String,
            },
        ],
        totalAmount: {
            type: Number,
            required: true,
        },
        deliveryAddress: {
            label: String,
            fullAddress: String,
            lat: Number,
            lng: Number,
            pincode: String,
        },
        paymentMethod: {
            type: String,
            enum: ['COD', 'POD_QR', 'ONLINE'],
            default: 'COD',
        },
        status: {
            type: String,
            enum: ['placed', 'accepted', 'cutting', 'ready', 'out', 'delivered', 'cancelled'],
            default: 'placed',
        },
        specialInstructions: {
            type: String,
            default: '',
        },
        placedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

orderSchema.index({ customerId: 1 });
orderSchema.index({ storeId: 1 });
orderSchema.index({ status: 1 });

module.exports = mongoose.model('Order', orderSchema);
