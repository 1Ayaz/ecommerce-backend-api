const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { upload, cloudinary } = require('../middleware/uploadMiddleware');
const { protect, authorize } = require('../middleware/authMiddleware');

/**
 * POST /api/upload
 * Upload a single image file to Cloudinary.
 * Requires: vendor or admin role (customers can't upload product images).
 * Body: multipart/form-data with field name "image"
 * Returns: { success: true, url: "https://res.cloudinary.com/..." }
 */
router.post(
    '/',
    protect,
    authorize('vendor', 'admin'),
    upload.single('image'),
    asyncHandler(async (req, res) => {
        if (!req.file) {
            res.status(400);
            throw new Error('No image file provided');
        }

        // multer-storage-cloudinary attaches the Cloudinary result to req.file
        res.status(200).json({
            success: true,
            url: req.file.path,           // secure HTTPS Cloudinary URL
            public_id: req.file.filename, // for future deletion if needed
        });
    })
);

/**
 * DELETE /api/upload/:public_id
 * Delete an image from Cloudinary by its public_id.
 * Useful when a vendor replaces an image — clean up the old one.
 */
router.delete(
    '/:public_id',
    protect,
    authorize('vendor', 'admin'),
    asyncHandler(async (req, res) => {
        const { public_id } = req.params;
        // public_id includes folder prefix, e.g. "freshcuts-products/abcd1234"
        const result = await cloudinary.uploader.destroy(decodeURIComponent(public_id));
        res.json({ success: true, result });
    })
);

module.exports = router;
