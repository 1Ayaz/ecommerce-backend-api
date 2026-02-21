const asyncHandler = require('express-async-handler');
const ProductService = require('../services/ProductService');
const Category = require('../models/Category');
const Product = require('../models/Product');

// @desc    Get all products (with optional filters)
// @route   GET /api/products?storeId=...&categoryId=...
const getProducts = asyncHandler(async (req, res) => {
    const query = { ...req.query };
    // Support ?featured=true
    if (query.featured === 'true') {
        query.featured = true;
    }
    const products = await ProductService.getProducts(query);
    res.status(200).json({ success: true, count: products.length, data: products });
});

// @desc    Get all categories (filtered by vendor/store if provided)
// @route   GET /api/products/categories?vendorId=...
const getCategories = asyncHandler(async (req, res) => {
    const { vendorId, storeId } = req.query;
    const filter = {};
    // Accept both vendorId and storeId — they refer to the same Store document
    const storeFilter = vendorId || storeId;
    if (storeFilter) {
        filter.storeId = storeFilter;
    }
    const categories = await Category.find(filter).sort({ name: 1 });
    res.status(200).json({ success: true, count: categories.length, data: categories });
});

// @desc    Get single product by ID
// @route   GET /api/products/:id
const getProductById = asyncHandler(async (req, res) => {
    const product = await ProductService.getProducts({ _id: req.params.id });
    if (!product || product.length === 0) {
        res.status(404);
        throw new Error('Product not found');
    }
    res.status(200).json({ success: true, data: product[0] });
});

// @desc    Get single product by slug (SEO-friendly)
// @route   GET /api/products/slug/:slug
const getProductBySlug = asyncHandler(async (req, res) => {
    const Product = require('../models/Product');
    const product = await Product.findOne({ slug: req.params.slug, isActive: true });
    if (!product) {
        res.status(404);
        throw new Error('Product not found');
    }
    res.status(200).json({ success: true, data: product });
});

// @desc    Create a product
// @route   POST /api/products
const createProduct = asyncHandler(async (req, res) => {
    const product = await ProductService.createProduct(req.body, req.user);
    res.status(201).json({ success: true, data: product });
});

// @desc    Update a product
// @route   PUT /api/products/:id
const updateProduct = asyncHandler(async (req, res) => {
    const updatedProduct = await ProductService.updateProduct(req.params.id, req.body, req.user);
    res.status(200).json({ success: true, data: updatedProduct });
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
const deleteProduct = asyncHandler(async (req, res) => {
    const result = await ProductService.deleteProduct(req.params.id, req.user);
    res.status(200).json({ success: true, message: result.message });
});

// @desc    Update vendor-specific price/stock for a product
// @route   PUT /api/products/vendor/override/:id
const updateVendorOverride = asyncHandler(async (req, res) => {
    const VendorProductService = require('../services/VendorProductService');
    const result = await VendorProductService.updateVendorPriceStock(
        req.user.vendorId,
        req.params.id,
        req.body
    );
    res.status(200).json({ success: true, data: result });
});

// @desc    Search products by keyword
// @route   GET /api/products/search?q=keyword
const searchProducts = asyncHandler(async (req, res) => {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
        return res.status(200).json({ success: true, count: 0, data: [] });
    }
    const products = await Product.find({
        name: { $regex: q.trim(), $options: 'i' },
        isActive: true,
        approved: true,
    }).sort({ isFeatured: -1, name: 1 });
    res.status(200).json({ success: true, count: products.length, data: products });
});

// @desc    Get products by category slug
// @route   GET /api/categories/:slug/products
const getProductsByCategory = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    let filter = { isActive: true, approved: true };

    if (slug !== 'all') {
        const category = await Category.findOne({ slug });
        if (!category) {
            res.status(404);
            throw new Error('Category not found');
        }
        filter.categoryId = category._id;
    }

    const products = await Product.find(filter).sort({ isFeatured: -1, createdAt: -1 });
    res.status(200).json({ success: true, count: products.length, data: products });
});

module.exports = {
    getProducts,
    getProductById,
    getProductBySlug,
    getCategories,
    searchProducts,
    getProductsByCategory,
    createProduct,
    updateProduct,
    deleteProduct,
    updateVendorOverride
};
