const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Category name is required'],
        },
        image: {
            type: String,
            required: [true, 'Category image is required'],
        },
        parentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            default: null,
        },
        storeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Store',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Category', categorySchema);
