const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');

// @desc    Get all products (with optional filters)
// @route   GET /api/products?storeId=...&categoryId=...
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
    const { storeId, categoryId } = req.query;

    const filter = {};
    if (storeId) filter.storeId = storeId;
    if (categoryId) filter.categoryId = categoryId;

    const products = await Product.find(filter)
        .populate('categoryId', 'name')
        .populate('storeId', 'name');

    res.status(200).json({ success: true, count: products.length, data: products });
});

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id)
        .populate('categoryId', 'name')
        .populate('storeId', 'name');

    if (!product) {
        res.status(404);
        throw new Error('Product not found');
    }

    res.status(200).json({ success: true, data: product });
});

module.exports = { getProducts, getProductById };
