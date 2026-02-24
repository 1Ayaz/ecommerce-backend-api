const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Category name is required'],
        },
        slug: {
            type: String,
            unique: true,
            sparse: true,
            index: true,
        },
        image: {
            type: String,
            required: [true, 'Category image is required'],
        },
        icon: {
            type: String,
            default: '',
        },
        order: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
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

// Auto-generate slug from category name before saving
categorySchema.pre('save', async function (next) {
    if (!this.isModified('name') && this.slug) return next();

    let baseSlug = this.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

    let slug = baseSlug;
    let counter = 1;
    const Category = this.constructor;
    while (await Category.findOne({ slug, _id: { $ne: this._id } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
    }
    this.slug = slug;
    next();
});

module.exports = mongoose.model('Category', categorySchema);
