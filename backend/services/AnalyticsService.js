const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const Store = require('../models/Store');
const mongoose = require('mongoose');

class AnalyticsService {
    /**
     * Dashboard KPIs — total revenue, orders, customers, avg order value
     */
    static async getDashboardKPIs(period = '30d') {
        const startDate = this._getStartDate(period);

        const [orderStats, customerCount] = await Promise.all([
            Order.aggregate([
                { $match: { createdAt: { $gte: startDate }, status: { $ne: 'cancelled' } } },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: '$totalAmount' },
                        totalOrders: { $sum: 1 },
                        avgOrderValue: { $avg: '$totalAmount' },
                    },
                },
            ]),
            User.countDocuments({ role: 'customer', createdAt: { $gte: startDate } }),
        ]);

        const stats = orderStats[0] || { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 };

        return {
            totalRevenue: Math.round(stats.totalRevenue),
            totalOrders: stats.totalOrders,
            avgOrderValue: Math.round(stats.avgOrderValue || 0),
            newCustomers: customerCount,
        };
    }

    /**
     * Revenue by day for charting
     */
    static async getRevenueOverTime(period = '30d') {
        const startDate = this._getStartDate(period);

        const data = await Order.aggregate([
            { $match: { createdAt: { $gte: startDate }, status: { $ne: 'cancelled' } } },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
                    },
                    revenue: { $sum: '$totalAmount' },
                    orders: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
            {
                $project: {
                    _id: 0,
                    date: '$_id',
                    revenue: 1,
                    orders: 1,
                },
            },
        ]);

        return data;
    }

    /**
     * Top selling products
     */
    static async getTopProducts(limit = 5, period = '30d') {
        const startDate = this._getStartDate(period);

        const data = await Order.aggregate([
            { $match: { createdAt: { $gte: startDate }, status: { $ne: 'cancelled' } } },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.name',
                    totalQuantity: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
                },
            },
            { $sort: { totalRevenue: -1 } },
            { $limit: limit },
            {
                $project: {
                    _id: 0,
                    name: '$_id',
                    totalQuantity: 1,
                    totalRevenue: { $round: ['$totalRevenue', 0] },
                },
            },
        ]);

        return data;
    }

    /**
     * Order status distribution
     */
    static async getOrderStatusBreakdown(period = '30d') {
        const startDate = this._getStartDate(period);

        const data = await Order.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                },
            },
            {
                $project: {
                    _id: 0,
                    status: '$_id',
                    count: 1,
                },
            },
        ]);

        return data;
    }

    /**
     * Recent orders
     */
    static async getRecentOrders(limit = 10) {
        return await Order.find()
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('customerId', 'name email phone')
            .populate('vendorId', 'name')
            .lean();
    }

    /**
     * Store Analytics — per-store revenue, commission, payouts
     */
    static async getStoreAnalytics(period = '30d') {
        const startDate = this._getStartDate(period);

        const storeOrders = await Order.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            {
                $group: {
                    _id: '$vendorId',
                    totalOrders: { $sum: 1 },
                    deliveredOrders: {
                        $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
                    },
                    cancelledOrders: {
                        $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
                    },
                    grossRevenue: {
                        $sum: {
                            $cond: [
                                { $ne: ['$status', 'cancelled'] },
                                '$totalAmount',
                                0
                            ]
                        }
                    },
                    itemsRevenue: {
                        $sum: {
                            $cond: [
                                { $ne: ['$status', 'cancelled'] },
                                { $ifNull: ['$financialSnapshot.itemsTotal', '$subTotal'] },
                                0
                            ]
                        }
                    },
                    commissionEarned: {
                        $sum: {
                            $cond: [
                                { $ne: ['$status', 'cancelled'] },
                                { $ifNull: ['$financialSnapshot.commissionAmount', 0] },
                                0
                            ]
                        }
                    },
                    deliveryBoyPayout: {
                        $sum: {
                            $cond: [
                                { $eq: ['$status', 'delivered'] },
                                { $ifNull: ['$financialSnapshot.deliveryBoyFee', 0] },
                                0
                            ]
                        }
                    },
                    deliveryFeeCollected: {
                        $sum: {
                            $cond: [
                                { $ne: ['$status', 'cancelled'] },
                                { $ifNull: ['$financialSnapshot.deliveryFee', 0] },
                                0
                            ]
                        }
                    }
                }
            },
            { $sort: { grossRevenue: -1 } }
        ]);

        // Lookup store details
        const storeIds = storeOrders.map(s => s._id);
        const stores = await Store.find({ _id: { $in: storeIds } })
            .select('name businessName commissionPercentage isActive')
            .lean();

        const storeMap = {};
        stores.forEach(s => { storeMap[s._id.toString()] = s; });

        return storeOrders.map(s => {
            const store = storeMap[s._id?.toString()] || {};
            const vendorPayout = Math.round(s.grossRevenue - s.commissionEarned);
            return {
                storeId: s._id,
                storeName: store.name || 'Unknown Store',
                businessName: store.businessName || '',
                commissionRate: store.commissionPercentage,
                isActive: store.isActive ?? true,
                totalOrders: s.totalOrders,
                deliveredOrders: s.deliveredOrders,
                cancelledOrders: s.cancelledOrders,
                grossRevenue: Math.round(s.grossRevenue),
                itemsRevenue: Math.round(s.itemsRevenue),
                commissionEarned: Math.round(s.commissionEarned),
                deliveryBoyPayout: Math.round(s.deliveryBoyPayout),
                deliveryFeeCollected: Math.round(s.deliveryFeeCollected),
                vendorPayout,
            };
        });
    }

    /**
     * Helper — convert period string to Date
     */
    static _getStartDate(period) {
        const now = new Date();
        switch (period) {
            case '7d': return new Date(now.setDate(now.getDate() - 7));
            case '30d': return new Date(now.setDate(now.getDate() - 30));
            case '90d': return new Date(now.setDate(now.getDate() - 90));
            case '1y': return new Date(now.setFullYear(now.getFullYear() - 1));
            default: return new Date(now.setDate(now.getDate() - 30));
        }
    }
}

module.exports = AnalyticsService;
