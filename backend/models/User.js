const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        firebaseUid: {
            type: String,
            unique: true,
            sparse: true,
        },
        phone: {
            type: String,
            unique: true,
            sparse: true,
        },
        email: {
            type: String,
            unique: true,
            sparse: true,
        },
        password: {
            type: String,
            select: false,
        },
        role: {
            type: String,
            enum: ['customer', 'driver', 'admin', 'vendor'],
            default: 'customer',
        },
        storeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Store',
            default: null,
        },
        name: {
            type: String,
        },
        photoURL: {
            type: String,
        },
        savedAddresses: [
            {
                label: { type: String, default: 'Home' },
                fullAddress: String,
                lat: Number,
                lng: Number,
                pincode: String,
            },
        ],
        isVerified: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

userSchema.index({ phone: 1 });
userSchema.index({ email: 1 });
userSchema.index({ firebaseUid: 1 });

module.exports = mongoose.model('User', userSchema);
