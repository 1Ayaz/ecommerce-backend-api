const asyncHandler = require('express-async-handler');
const Settings = require('../models/Settings');
const { createAuditLog } = require('./auditLogController');

// @desc    Get system settings (admin)
// @route   GET /api/settings
// @access  Private/Admin
const getSettings = asyncHandler(async (req, res) => {
    let settings = await Settings.findOne();
    if (!settings) {
        settings = await Settings.create({});
    }
    res.json({ success: true, data: settings });
});

// @desc    Get public settings (banners, logo, payment methods) for customer frontend
// @route   GET /api/settings/public
// @access  Public
const getPublicSettings = asyncHandler(async (req, res) => {
    let settings = await Settings.findOne();
    if (!settings) {
        settings = await Settings.create({});
    }
    const activeBanners = (settings.banners || [])
        .filter(b => b.isActive)
        .sort((a, b) => a.order - b.order);

    res.json({
        success: true,
        data: {
            logoUrl: settings.logoUrl || '',
            siteName: settings.siteName,
            banners: activeBanners,
            // Payment method toggles (frontend uses this to show/hide options)
            paymentMethods: settings.paymentMethods || { codEnabled: true },
            deliveryFee: settings.deliveryFee,
            freeDeliveryThreshold: settings.freeDeliveryThreshold,
        }
    });
});

// @desc    Update system settings
// @route   PUT /api/settings
// @access  Private/Admin
const updateSettings = asyncHandler(async (req, res) => {
    let settings = await Settings.findOne();
    if (!settings) {
        settings = await Settings.create({});
    }

    const {
        siteName, supportEmail, supportPhone,
        deliveryFee, freeDeliveryThreshold, taxRate,
        platformServiceFee, commissionPercentage,
        maintenanceMode, allowRegistrations,
        paymentMethods
    } = req.body;

    settings.siteName = siteName || settings.siteName;
    settings.supportEmail = supportEmail || settings.supportEmail;
    settings.supportPhone = supportPhone || settings.supportPhone;
    settings.deliveryFee = deliveryFee !== undefined ? deliveryFee : settings.deliveryFee;
    settings.freeDeliveryThreshold = freeDeliveryThreshold !== undefined ? freeDeliveryThreshold : settings.freeDeliveryThreshold;
    settings.taxRate = taxRate !== undefined ? taxRate : settings.taxRate;
    settings.platformServiceFee = platformServiceFee !== undefined ? platformServiceFee : settings.platformServiceFee;
    settings.commissionPercentage = commissionPercentage !== undefined ? commissionPercentage : settings.commissionPercentage;
    settings.maintenanceMode = maintenanceMode !== undefined ? maintenanceMode : settings.maintenanceMode;
    settings.allowRegistrations = allowRegistrations !== undefined ? allowRegistrations : settings.allowRegistrations;

    // Merge payment method toggles individually to avoid full overwrite
    if (paymentMethods && typeof paymentMethods === 'object') {
        settings.paymentMethods = { ...settings.paymentMethods.toObject?.() || settings.paymentMethods, ...paymentMethods };
    }

    const updatedSettings = await settings.save();

    await createAuditLog(req.user._id, 'UPDATE', 'Settings', updatedSettings._id, { changes: req.body }, req);

    res.json({ success: true, data: updatedSettings });
});

// @desc    Update banners
// @route   PUT /api/settings/banners
// @access  Private/Admin
const updateBanners = asyncHandler(async (req, res) => {
    let settings = await Settings.findOne();
    if (!settings) {
        settings = await Settings.create({});
    }

    const { banners } = req.body;
    if (!Array.isArray(banners)) {
        res.status(400);
        throw new Error('Banners must be an array');
    }

    settings.banners = banners;
    await settings.save();

    await createAuditLog(req.user._id, 'UPDATE', 'Settings', settings._id, { action: 'Updated banners' }, req);

    res.json({ success: true, data: settings.banners });
});

// @desc    Update logo
// @route   PUT /api/settings/logo
// @access  Private/Admin
const updateLogo = asyncHandler(async (req, res) => {
    let settings = await Settings.findOne();
    if (!settings) {
        settings = await Settings.create({});
    }

    const { logoUrl } = req.body;
    if (!logoUrl) {
        res.status(400);
        throw new Error('Logo URL is required');
    }

    settings.logoUrl = logoUrl;
    await settings.save();

    await createAuditLog(req.user._id, 'UPDATE', 'Settings', settings._id, { action: 'Updated logo' }, req);

    res.json({ success: true, data: { logoUrl: settings.logoUrl } });
});

module.exports = {
    getSettings,
    getPublicSettings,
    updateSettings,
    updateBanners,
    updateLogo
};
