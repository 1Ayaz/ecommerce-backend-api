const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');

// Connect to Database
connectDB();

const app = express();

// --------------- Middleware ---------------
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// --------------- Routes ---------------
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'Mubarak API is running 🐔' });
});

// Auth Routes
app.use('/api/auth', require('./routes/authRoutes'));

// Store Routes
app.use('/api/stores', require('./routes/storeRoutes'));

// Product Routes
app.use('/api/products', require('./routes/productRoutes'));

// Order Routes
app.use('/api/orders', require('./routes/orderRoutes'));

// --------------- Error Handler ---------------
app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
        success: false,
        error: {
            code: err.code || 'SERVER_ERROR',
            message: err.message,
        },
    });
});

// --------------- Start Server ---------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Mubarak API running on port ${PORT}`);
});
