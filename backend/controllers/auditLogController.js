const asyncHandler = require('express-async-handler');
const AuditLog = require('../models/AuditLog');

// @desc    Get all audit logs
// @route   GET /api/audit-logs
// @access  Private/Admin
const getAuditLogs = asyncHandler(async (req, res) => {
    const pageSize = 50;
    const page = Number(req.query.pageNumber) || 1;

    const count = await AuditLog.countDocuments({});
    const logs = await AuditLog.find({})
        .populate('user', 'name email role')
        .sort({ createdAt: -1 })
        .limit(pageSize)
        .skip(pageSize * (page - 1));

    res.json({
        success: true,
        data: logs,
        page,
        pages: Math.ceil(count / pageSize),
        total: count
    });
});

// Helper to create a log (internal use)
const createAuditLog = async (userId, action, resource, resourceId, details = {}, req = null) => {
    try {
        await AuditLog.create({
            user: userId,
            action,
            resource,
            resourceId,
            details,
            ipAddress: req ? req.ip : '',
            userAgent: req ? req.get('User-Agent') : ''
        });
    } catch (error) {
        console.error('Failed to create audit log:', error);
    }
};

module.exports = {
    getAuditLogs,
    createAuditLog
};
