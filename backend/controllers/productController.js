const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const Category = require('../models/Category');

// @desc    Get all products for a store (optionally filter by category)
// @route   GET /api/products?storeId=...&categoryId=...
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
    const { storeId, categoryId } = req.query;
    console.log(`[DEBUG] getProducts called - storeId: ${storeId}, categoryId: ${categoryId}`);

    if (!storeId) {
        res.status(400);
        throw new Error('storeId is required');
    }

    const filter = { storeId, "variants.inStock": true };
    if (categoryId) filter.categoryId = categoryId;

    const products = await Product.find(filter).populate('categoryId', 'name').sort({ name: 1 });
    console.log(`[DEBUG] getProducts returning ${products.length} products for filter:`, JSON.stringify(filter));

    res.status(200).json({ success: true, count: products.length, data: products });
});

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id).populate('categoryId', 'name');

    if (!product) {
        res.status(404);
        throw new Error('Product not found');
    }

    res.status(200).json({ success: true, data: product });
});

// @desc    Get categories for a store
// @route   GET /api/products/categories?storeId=...
// @access  Public
const getCategories = asyncHandler(async (req, res) => {
    const { storeId } = req.query;

    const filter = {};
    if (storeId) filter.storeId = storeId;

    const categories = await Category.find(filter).sort({ name: 1 });
    res.status(200).json({ success: true, data: categories });
});

module.exports = { getProducts, getProductById, getCategories };
