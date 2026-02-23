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
        vendorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Store', // Store model represents the Vendor entity
            default: null,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        name: {
            type: String,
        },
        photoURL: {
            type: String,
        },
        deliveryPin: {
            type: String, // 4-digit static PIN
        },
        fcmToken: {
            type: String,
            default: null,
        },
        isOnline: {
            type: Boolean,
            default: true, // For delivery partners
        },
        pushSubscription: {
            type: Object, // Stores VAPID push manager endpoint & keys
            default: null,
        },
        savedAddresses: [
            {
                label: {
                    type: String,
                    enum: ['home', 'work', 'other'],
                    default: 'home'
                },
                name: String,            // Recipient name
                phone: String,           // Contact phone for this address
                flat: String,            // Flat / House Number
                building: String,        // Building / Street Name
                area: String,            // Area / Locality
                landmark: String,        // Landmark (optional)
                city: String,
                state: String,
                pincode: String,
                fullAddress: String,     // Auto-composed or reverse-geocoded
                lat: Number,
                lng: Number,
            },
        ],
        isVerified: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// Pre-save hook to generate static delivery PIN for customers
userSchema.pre('save', function (next) {
    if (this.isNew && this.role === 'customer' && !this.deliveryPin) {
        // Generate random 4-digit PIN
        this.deliveryPin = Math.floor(1000 + Math.random() * 9000).toString();
    }
    next();
});

// Create indexes for optimized queries (without duplicates from unique:true)
userSchema.index({ role: 1 });
userSchema.index({ vendorId: 1 });
userSchema.index({ isActive: 1 });

module.exports = mongoose.model('User', userSchema);
