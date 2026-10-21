const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary SDK from env vars (cleaning quotes/whitespace or using CLOUDINARY_URL)
const cloud_name = (process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME || process.env.CLOUD_NAME || '').replace(/['"]/g, '').trim();
const api_key = (process.env.CLOUDINARY_API_KEY || process.env.API_KEY || '').replace(/['"]/g, '').trim();
const api_secret = (process.env.CLOUDINARY_API_SECRET || process.env.API_SECRET || '').replace(/['"]/g, '').trim();

if (process.env.CLOUDINARY_URL) {
    cloudinary.config();
} else if (cloud_name && api_key && api_secret) {
    cloudinary.config({
        cloud_name,
        api_key,
        api_secret,
    });
} else {
    cloudinary.config({
        cloud_name,
        api_key,
        api_secret,
    });
}

// Store uploaded files directly in Cloudinary (no local disk)
const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'freshcuts-products',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [
            { width: 800, height: 800, crop: 'limit' }, // max 800x800, no upscaling
            { quality: 'auto:good' },                   // smart compression
            { fetch_format: 'auto' },                   // serve webp to modern browsers
        ],
    },
});

// Reject files over 5MB
const limits = { fileSize: 5 * 1024 * 1024 };

const upload = multer({ storage, limits });

module.exports = { upload, cloudinary };
