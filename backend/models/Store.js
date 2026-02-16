const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Store name is required'],
        },
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point',
            },
            coordinates: {
                type: [Number], // [longitude, latitude]
                default: [0, 0],
            },
        },
        address: {
            type: String,
        },
        servicePincodes: {
            type: [String],
            required: true,
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
    },
    { timestamps: true }
);

storeSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Store', storeSchema);
