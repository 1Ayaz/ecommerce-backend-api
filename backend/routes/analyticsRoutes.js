const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { protect, authorize } = require('../middleware/authMiddleware');
const AnalyticsService = require('../services/AnalyticsService');

// All analytics routes are admin-only
router.use(protect, authorize('admin'));

// GET /api/analytics/dashboard — KPI summary
router.get('/dashboard', asyncHandler(async (req, res) => {
    const period = req.query.period || '30d';
    const kpis = await AnalyticsService.getDashboardKPIs(period);
    res.json({ success: true, data: kpis });
}));

// GET /api/analytics/revenue — Revenue over time
router.get('/revenue', asyncHandler(async (req, res) => {
    const period = req.query.period || '30d';
    const data = await AnalyticsService.getRevenueOverTime(period);
    res.json({ success: true, data });
}));

// GET /api/analytics/top-products — Best sellers
router.get('/top-products', asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 5;
    const period = req.query.period || '30d';
    const data = await AnalyticsService.getTopProducts(limit, period);
    res.json({ success: true, data });
}));

// GET /api/analytics/order-status — Status distribution
router.get('/order-status', asyncHandler(async (req, res) => {
    const period = req.query.period || '30d';
    const data = await AnalyticsService.getOrderStatusBreakdown(period);
    res.json({ success: true, data });
}));

// GET /api/analytics/recent-orders — Last N orders
router.get('/recent-orders', asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const data = await AnalyticsService.getRecentOrders(limit);
    res.json({ success: true, data });
}));

// GET /api/analytics/store-analytics — Per-store revenue, commission, payouts
router.get('/store-analytics', asyncHandler(async (req, res) => {
    const period = req.query.period || '30d';
    const data = await AnalyticsService.getStoreAnalytics(period);
    res.json({ success: true, data });
}));

module.exports = router;
