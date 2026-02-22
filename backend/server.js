const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const { globalLimiter, authLimiter, orderLimiter } = require('./middleware/rateLimit');

// Connect to Database
if (process.env.NODE_ENV !== 'test') {
    connectDB();
}

const app = express();

// Enable trust proxy for rate limiting behind proxies (Heroku, Nginx, etc.)
app.set('trust proxy', 1);

// --------------- Middleware ---------------
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(helmet({
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rate Limiting
app.use('/api', globalLimiter);

// --------------- Routes ---------------
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'Mubarak API is running 🐔' });
});

// Auth Routes
app.use('/api/auth', authLimiter, require('./routes/authRoutes'));

// Store Routes
app.use('/api/stores', require('./routes/storeRoutes'));

// Product Routes
app.use('/api/products', require('./routes/productRoutes'));

// Category Routes
app.use('/api/categories', require('./routes/categoryRoutes'));

// Coupon Routes
app.use('/api/coupons', require('./routes/couponRoutes'));

// Order Routes
app.use('/api/orders', require('./routes/orderRoutes'));

// Audit Log Routes
app.use('/api/audit-logs', require('./routes/auditLogRoutes'));

// Settings Routes
app.use('/api/settings', require('./routes/settingsRoutes'));

// Analytics Routes (admin only)
app.use('/api/analytics', require('./routes/analyticsRoutes'));

// Delivery Routes
app.use('/api/delivery', require('./routes/deliveryRoutes'));
app.use('/api/location', require('./routes/locationRoutes'));

// SEO: Auto-generated sitemap
app.use('/', require('./routes/sitemapRoutes'));

// User Routes (Profile, Addresses)
app.use('/api/users', require('./routes/userRoutes'));

// Wishlist Routes
app.use('/api/wishlist', require('./routes/wishlistRoutes'));


// --------------- Error Handler ---------------
app.use(require('./middleware/errorMiddleware'));


// --------------- Start Server ---------------
const PORT = process.env.PORT || 5000;
const http = require('http');
const { initSocket } = require('./utils/socket');

const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Only start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
    server.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Mubarak API & Real-time Server running on port ${PORT} (0.0.0.0)`);
    });
}

// Crash protection — log and keep running
process.on('uncaughtException', (err) => {
    console.error('💥 Uncaught Exception:', err.message);
    console.error(err.stack);
});

process.on('unhandledRejection', (reason) => {
    console.error('💥 Unhandled Rejection:', reason);
});

// Export app for testing
module.exports = app;
