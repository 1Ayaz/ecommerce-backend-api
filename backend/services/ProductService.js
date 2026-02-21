const Product = require('../models/Product');
const VendorProduct = require('../models/VendorProduct');
const ApiError = require('../utils/ApiError');
const mongoose = require('mongoose');

class ProductService {
    /**
     * Get Products with Global Catalog + Vendor Overrides
     */
    static async getProducts(query) {
        const { vendorId, categoryId, search, featured, approved = true } = query;

        const pipeline = [
            { $match: { approved: approved === true || approved === 'true' } }
        ];

        // Featured filter
        if (featured === true || featured === 'true') {
            pipeline.push({ $match: { isFeatured: true, isActive: true } });
        }

        // Text search filter
        if (search) {
            pipeline.push({ $match: { name: { $regex: search, $options: 'i' } } });
        }

        if (categoryId) {
            pipeline.push({ $match: { categoryId: new mongoose.Types.ObjectId(categoryId) } });
        }

        // Left Join with VendorProduct overrides
        if (vendorId) {
            pipeline.push(
                {
                    $lookup: {
                        from: 'vendorproducts',
                        let: { globalProductId: '$_id' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ['$productId', '$$globalProductId'] },
                                            { $eq: ['$vendorId', new mongoose.Types.ObjectId(vendorId)] },
                                            { $eq: ['$isActive', true] }
                                        ]
                                    }
                                }
                            }
                        ],
                        as: 'overrides'
                    }
                },
                // Merge overrides into variations
                {
                    $addFields: {
                        variations: {
                            $map: {
                                input: '$variations',
                                as: 'v',
                                in: {
                                    $mergeObjects: [
                                        '$$v',
                                        {
                                            $arrayElemAt: [
                                                {
                                                    $filter: {
                                                        input: '$overrides',
                                                        as: 'o',
                                                        cond: { $eq: ['$$o.variationLabel', '$$v.label'] }
                                                    }
                                                },
                                                0
                                            ]
                                        }
                                    ]
                                }
                            }
                        }
                    }
                }
            );
        }

        return await Product.aggregate(pipeline);
    }

    /**
     * Create Product (Catalog)
     */
    static async createProduct(productData, user) {
        if (user.role !== 'admin') {
            throw new ApiError(403, 'Only admins can add products to the global catalog');
        }

        return await Product.create({
            ...productData,
            createdBy: user._id,
            approved: true
        });
    }

    /**
     * Update Global Product (Admin Only)
     */
    static async updateProduct(productId, updateData, user) {
        if (user.role !== 'admin') {
            throw new ApiError(403, 'Only admins can update global catalog products');
        }

        return await Product.findByIdAndUpdate(productId, updateData, {
            new: true,
            runValidators: true,
        });
    }

    /**
     * Delete Product (Admin Only)
     */
    static async deleteProduct(productId, user) {
        if (user.role !== 'admin') {
            throw new ApiError(403, 'Only admins can delete global catalog products');
        }

        await Product.deleteOne({ _id: productId });
        return { message: 'Product successfully removed from global catalog' };
    }
}

module.exports = ProductService;
