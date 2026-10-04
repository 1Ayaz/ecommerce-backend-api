const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
        unique: true, // one rating per order
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
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
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    comment: {
        type: String,
        maxlength: 300,
        default: '',
    },
}, { timestamps: true });

// Index for fast product/store lookups
ratingSchema.index({ productId: 1, createdAt: -1 });
ratingSchema.index({ vendorId: 1, createdAt: -1 });
ratingSchema.index({ customerId: 1 });

module.exports = mongoose.model('Rating', ratingSchema);
