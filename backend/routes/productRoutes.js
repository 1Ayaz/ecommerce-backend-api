const express = require('express');
const router = express.Router();
const {
    getProducts,
    getProductById,
    getProductBySlug,
    getCategories,
    searchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    updateVendorOverride
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { validateProduct, validateMongoId } = require('../middleware/validation');


// Public routes
router.get('/', getProducts);
router.get('/categories', getCategories);
router.get('/search', searchProducts);

// Protected vendor-specific routes (must come before :id routes)
router.put('/vendor/override/:id', protect, authorize('vendor', 'admin'), validateMongoId, updateVendorOverride);

// SEO-friendly slug route (must come before :id)
router.get('/slug/:slug', getProductBySlug);

// Parameterized routes
router.get('/:id', validateMongoId, getProductById);

// Protected routes — Admin-only catalog management
router.post('/', protect, authorize('admin'), validateProduct, createProduct);
router.put('/:id', protect, authorize('admin'), validateMongoId, validateProduct, updateProduct);
router.delete('/:id', protect, authorize('admin'), validateMongoId, deleteProduct);

module.exports = router;
