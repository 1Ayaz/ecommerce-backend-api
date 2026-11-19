const path = require('path');
const dotenv = require('dotenv');
// Ensure .env is loaded whether run from repo root or backend/ folder
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const { globalLimiter, authLimiter, orderLimiter } = require('./middleware/rateLimit');

// Connection will be handled in startServer() at the bottom of the file

const app = express();

// Enable trust proxy for rate limiting behind proxies (Heroku, Nginx, etc.)
app.set('trust proxy', 1);

// --------------- Middleware ---------------
// Build allowed origins from CLIENT_URL env var (supports comma-separated list)
const buildAllowedOrigins = () => {
    const origins = ['http://localhost:5173', 'http://localhost:3000'];
    if (process.env.CLIENT_URL) {
        process.env.CLIENT_URL.split(',').forEach(url => origins.push(url.trim()));
    }
    return origins;
};
const allowedOrigins = buildAllowedOrigins();
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || !process.env.CLIENT_URL) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`CORS: ${origin} not allowed`));
    },
    credentials: true
}));
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
    res.json({ status: 'ok', message: 'The Fresh Cuts API is running 🐔' });
});

// Health and DB check
app.get('/health', (req, res) => {
    const isDbConnected = require('mongoose').connection.readyState === 1;
    res.json({
        status: 'ok',
        database: isDbConnected ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
    });
});
app.get('/api/health', (req, res) => {
    const isDbConnected = require('mongoose').connection.readyState === 1;
    res.json({
        status: 'ok',
        database: isDbConnected ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
    });
});

// Guard API routes if database is not connected
app.use('/api', (req, res, next) => {
    if (req.path === '/health') return next();
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
            success: false,
            message: 'Database connection in progress or paused. If using MongoDB Atlas Free Tier, please resume your cluster at cloud.mongodb.com.'
        });
    }
    next();
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

// Rating Routes
app.use('/api/ratings', require('./routes/ratingRoutes'));

// WhatsApp Webhook Routes
app.use('/api/whatsapp', require('./routes/whatsappRoutes'));

// Image Upload Routes (Cloudinary)
app.use('/api/upload', require('./routes/uploadRoutes'));


// --------------- Error Handler ---------------
app.use(require('./middleware/errorMiddleware'));


// --------------- Start Server ---------------
const PORT = process.env.PORT || 5000;
const http = require('http');
const { initSocket } = require('./utils/socket');

const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Combined Startup Function
const startServer = async () => {
    try {
        // 1. Start HTTP Server immediately so Render port check always succeeds
        if (process.env.NODE_ENV !== 'test') {
            server.listen(PORT, '0.0.0.0', () => {
                console.log(`🚀 The Fresh Cuts API & Real-time Server running on port ${PORT} (0.0.0.0)`);
            });
        }

        // 2. Connect to Database with background retry loop
        if (process.env.NODE_ENV !== 'test') {
            await connectDB();
            // If connection not established, periodically retry every 15s
            setInterval(() => {
                const mongoose = require('mongoose');
                if (mongoose.connection.readyState === 0) {
                    console.log('🔄 Retrying MongoDB connection...');
                    connectDB();
                }
            }, 15000);
        }
    } catch (err) {
        console.error('❌ Server startup error:', err.message);
    }
};

startServer();

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
