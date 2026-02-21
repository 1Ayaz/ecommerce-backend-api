const rateLimit = require('express-rate-limit');

const isDev = process.env.NODE_ENV !== 'production';

// In development, skip rate limiting entirely
const passThrough = (req, res, next) => next();

// Global API rate limiter — 500 requests per 15 minutes per IP
const globalLimiter = isDev ? passThrough : rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: { message: 'Too many requests. Please try again after 15 minutes.' }
    },
});

// Auth limiter — 30 login attempts per 15 minutes
const authLimiter = isDev ? passThrough : rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: { message: 'Too many login attempts. Please try again after 15 minutes.' }
    },
});

// Order limiter — 20 order submissions per hour
const orderLimiter = isDev ? passThrough : rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: { message: 'Too many orders placed. Please try again later.' }
    },
});

module.exports = { globalLimiter, authLimiter, orderLimiter };
