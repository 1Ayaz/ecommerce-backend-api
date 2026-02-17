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
        variants: [
            {
                weight: {
                    type: String,
                    required: true,
                },
                price: {
                    type: Number,
                    required: true,
                },
                marketPrice: {
                    type: Number,
                },
                inStock: {
                    type: Boolean,
                    default: true,
                },
                bestValue: {
                    type: Boolean,
                    default: false,
                },
            },
        ],
        cutOptions: {
            type: [String],
            default: [],
        },
        image: {
            type: String,
            required: [true, 'Product image is required'],
        },
        images: {
            type: [String],
            default: function () {
                return this.image ? [this.image] : [];
            }
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
