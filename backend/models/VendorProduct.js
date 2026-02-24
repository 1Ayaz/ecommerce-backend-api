const mongoose = require('mongoose');

const vendorProductSchema = new mongoose.Schema(
    {
        vendorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Store',
            required: true,
        },
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        variationLabel: {
            type: String, // Matches the 'label' in Product.variations
            required: true,
        },
        price: {
            type: Number,
            required: true,
        },
        inStock: {
            type: Boolean,
            default: true,
        },
        stockQty: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

// Compound index for fast lookup of specific variation for a vendor
vendorProductSchema.index({ vendorId: 1, productId: 1, variationLabel: 1 }, { unique: true });
vendorProductSchema.index({ vendorId: 1, productId: 1 });

module.exports = mongoose.model('VendorProduct', vendorProductSchema);
