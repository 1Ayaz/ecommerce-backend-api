const mongoose = require('mongoose');

const deliverySlabSchema = new mongoose.Schema({
    fromKm: { type: Number, required: true },
    toKm: { type: Number, required: true },
    fee: { type: Number, required: true }
}, { _id: false });

const storeSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Store name is required'],
        },
        businessName: {
            type: String,
        },
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        city: {
            type: String,
        },
        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point',
            },
            coordinates: {
                type: [Number],
                required: true,
            },
        },
        serviceArea: {
            type: {
                type: String,
                enum: ['Polygon'],
                default: 'Polygon',
            },
            coordinates: {
                type: [[[Number]]],
                default: undefined,
            },
        },
        address: {
            type: String,
            required: true,
        },
        servicePincodes: {
            type: [String],
            default: [],
        },
        serviceRadiusKm: {
            type: Number,
            default: 5,
        },
        isOpen: {
            type: Boolean,
            default: true,
        },
        phone: String,
        image: String,

        // Vendor delivery pricing configuration
        deliveryConfig: {
            freeDeliveryRadiusKm: {
                type: Number,
                default: 5
            },
            freeDeliveryAboveAmount: {
                type: Number,
                default: 499
            },
            deliverySlabs: {
                type: [deliverySlabSchema],
                default: [
                    { fromKm: 0, toKm: 5, fee: 0 },
                    { fromKm: 5, toKm: 10, fee: 30 },
                    { fromKm: 10, toKm: 15, fee: 50 }
                ]
            },
            deliveryBoyFeePerOrder: {
                type: Number,
                default: 30  // Amount paid to delivery boy per completed delivery
            }
        },

        // Store-level commission (overrides global Settings.commissionPercentage when set)
        commissionPercentage: {
            type: Number,
            default: null  // null = use global setting
        }
    },
    { timestamps: true }
);

storeSchema.index({ location: '2dsphere' });
storeSchema.index({ serviceArea: '2dsphere' });

module.exports = mongoose.model('Store', storeSchema);
