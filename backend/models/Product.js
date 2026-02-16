const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
    {
        storeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Store',
            required: true,
        },
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            required: true,
        },
        name: {
            type: String,
            required: [true, 'Product name is required'],
        },
        description: {
            type: String,
            default: 'Fresh • Cleaned • Cut After Order',
        },
        price: {
            type: Number,
            required: [true, 'Price is required'],
        },
        marketPrice: {
            type: Number,
        },
        weightLabel: {
            type: String,
            required: [true, 'Weight label is required'],
        },
        cutOptions: {
            type: [String],
            default: [],
        },
        inStock: {
            type: Boolean,
            default: true,
        },
        isVeg: {
            type: Boolean,
            default: false,
        },
        image: {
            type: String,
            required: [true, 'Product image is required'],
        },
        deliveryTime: {
            type: Number,
            default: 20,
        },
    },
    { timestamps: true }
);

productSchema.index({ storeId: 1, categoryId: 1 });

module.exports = mongoose.model('Product', productSchema);
