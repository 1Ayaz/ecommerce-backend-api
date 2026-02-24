const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Category = require('../models/Category');
const { getProductsByCategory } = require('../controllers/productController');
const { protect, authorize } = require('../middleware/authMiddleware');

// @desc    Get all categories
// @route   GET /api/categories
router.get('/', asyncHandler(async (req, res) => {
    const filter = { isActive: true };
    const categories = await Category.find(filter).sort({ order: 1, name: 1 });
    res.status(200).json({ success: true, count: categories.length, data: categories });
}));

// @desc    Get products by category slug
// @route   GET /api/categories/:slug/products
router.get('/:slug/products', getProductsByCategory);

// @desc    Create a category
// @route   POST /api/categories
router.post('/', protect, authorize('admin'), asyncHandler(async (req, res) => {
    const { name, image, icon, order } = req.body;
    if (!name || !image) {
        res.status(400);
        throw new Error('Category name and image are required');
    }
    const category = await Category.create({ name, image, icon, order });
    res.status(201).json({ success: true, data: category });
}));

// @desc    Update a category
// @route   PUT /api/categories/:id
router.put('/:id', protect, authorize('admin'), asyncHandler(async (req, res) => {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });
    if (!category) {
        res.status(404);
        throw new Error('Category not found');
    }
    res.status(200).json({ success: true, data: category });
}));

// @desc    Delete a category
// @route   DELETE /api/categories/:id
router.delete('/:id', protect, authorize('admin'), asyncHandler(async (req, res) => {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
        res.status(404);
        throw new Error('Category not found');
    }
    res.status(200).json({ success: true, message: 'Category deleted' });
}));

module.exports = router;
