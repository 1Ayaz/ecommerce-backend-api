const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
    {
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
        shortDescription: {
            type: String,
            default: '',
        },
        fullDescription: {
            type: String,
            default: '',
        },
        variations: [
            {
                label: {
                    type: String, // "250g Pack", "500g Pack", "1000g Pack"
                    required: true,
                },
                basePrice: {
                    type: Number,
                    required: true,
                },
                price: {
                    type: Number, // alias / computed — frontend uses this
                },
                discountedPrice: {
                    type: Number,
                    default: null,
                },
                stock: {
                    type: Number,
                    default: 0,
                },
                sku: {
                    type: String,
                    default: '',
                },
                desc: {
                    type: String, // e.g. "~10 pcs | serves 5"
                    default: '',
                },
                isActive: {
                    type: Boolean,
                    default: true,
                },
            },
        ],
        image: {
            type: String,
            required: [true, 'Product image is required'],
        },
        images: {
            type: [String],
            default: function () {
                return this.image ? [this.image] : [];
            },
        },
        isFeatured: {
            type: Boolean,
            default: false,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        approved: {
            type: Boolean,
            default: false,
        },

        // ── Seller Details ─────────────────────────────────
        sellerDetails: {
            name: { type: String, default: '' },
            deliveryEstimate: { type: String, default: '' },
            location: { type: String, default: '' },
            foodLicense: { type: String, default: '' },
        },

        // ── Visibility Toggles ─────────────────────────────
        showShortDescription: {
            type: Boolean,
            default: true,
        },
        showFullDescription: {
            type: Boolean,
            default: true,
        },
        showSellerDetails: {
            type: Boolean,
            default: false,
        },
        shareEnabled: {
            type: Boolean,
            default: true,
        },
        wishlistEnabled: {
            type: Boolean,
            default: true,
        },

        // ── SEO Fields ─────────────────────────────────────
        slug: {
            type: String,
            unique: true,
            sparse: true,
            index: true,
        },
        metaTitle: {
            type: String,
            default: '',
        },
        metaDescription: {
            type: String,
            default: '',
        },
        imageAlt: {
            type: String,
            default: '',
        },
    },
    { timestamps: true }
);

// Auto-generate slug from product name before saving
productSchema.pre('save', async function (next) {
    if (!this.isModified('name') && this.slug) return next();

    let baseSlug = this.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

    let slug = baseSlug;
    let counter = 1;
    const Product = this.constructor;
    while (await Product.findOne({ slug, _id: { $ne: this._id } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
    }

    this.slug = slug;

    // Auto-fill SEO defaults if empty
    if (!this.metaTitle) {
        this.metaTitle = `${this.name} – Fresh Chicken Delivery | Mubarak`;
    }
    if (!this.metaDescription) {
        this.metaDescription = `Order ${this.name} online. ${this.description}. Fresh, cleaned, halaal certified. Delivered in 20 minutes.`;
    }
    if (!this.imageAlt) {
        this.imageAlt = `${this.name} - Fresh halaal chicken from Mubarak`;
    }

    next();
});

// Ensure variation.price mirrors basePrice if not set
productSchema.pre('save', function (next) {
    if (this.variations && this.variations.length > 0) {
        this.variations.forEach((v) => {
            if (!v.price) v.price = v.basePrice;
        });
    }
    next();
});

productSchema.index({ categoryId: 1, approved: 1 });
productSchema.index({ name: 'text' });
productSchema.index({ isFeatured: 1, isActive: 1 });

module.exports = mongoose.model('Product', productSchema);
