const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Store = require('../models/Store');
const Product = require('../models/Product');
const Order = require('../models/Order');
const jwt = require('jsonwebtoken');

// Test database connection
const MONGO_URI_TEST = process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/mubarak_test';

beforeAll(async () => {
    await mongoose.connect(MONGO_URI_TEST);
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
});

afterEach(async () => {
    await User.deleteMany({});
    await Store.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
});

// Helper function to generate token
const generateToken = (userId, role) => {
    return jwt.sign({ id: userId, role }, process.env.JWT_ACCESS_SECRET, { expiresIn: '1h' });
};

describe('Authentication Tests', () => {
    describe('POST /api/auth/send-otp', () => {
        it('should send OTP for valid phone number', async () => {
            const res = await request(app)
                .post('/api/auth/send-otp')
                .send({ phone: '9876543210' });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('OTP sent successfully');
        });

        it('should reject invalid phone number', async () => {
            const res = await request(app)
                .post('/api/auth/send-otp')
                .send({ phone: '123' });

            expect(res.statusCode).toBe(400);
        });
    });

    describe('POST /api/auth/verify-otp', () => {
        it('should reject invalid OTP', async () => {
            const res = await request(app)
                .post('/api/auth/verify-otp')
                .send({ phone: '9876543210', otp: '000000' });

            expect(res.statusCode).toBe(401);
        });
    });
});

describe('Store Tests', () => {
    let store;

    beforeEach(async () => {
        store = await Store.create({
            name: 'Test Store',
            location: { type: 'Point', coordinates: [81.804, 17.0005] },
            address: 'Test Address',
            servicePincodes: ['533101'],
            serviceRadiusKm: 5,
            isOpen: true,
        });
    });

    describe('GET /api/stores/nearby', () => {
        it('should find nearby store with valid coordinates', async () => {
            const res = await request(app)
                .get('/api/stores/nearby')
                .query({ lat: 17.0005, lng: 81.804 });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toBeDefined();
        });

        it('should return 404 when no store nearby', async () => {
            const res = await request(app)
                .get('/api/stores/nearby')
                .query({ lat: 0, lng: 0 });

            expect(res.statusCode).toBe(404);
        });

        it('should find store by pincode', async () => {
            const res = await request(app)
                .get('/api/stores/nearby')
                .query({ pincode: '533101' });

            expect(res.statusCode).toBe(200);
            expect(res.body.data.name).toBe('Test Store');
        });
    });
});

describe('Order Tests', () => {
    let customer, vendor, store, product, token;

    beforeEach(async () => {
        // Create test store
        store = await Store.create({
            name: 'Test Store',
            location: { type: 'Point', coordinates: [81.804, 17.0005] },
            address: 'Test Address',
            servicePincodes: ['533101'],
            serviceRadiusKm: 5,
            isOpen: true,
        });

        // Create test customer
        customer = await User.create({
            name: 'Test Customer',
            email: 'customer@test.com',
            role: 'customer',
            isVerified: true,
        });

        // Create test vendor
        vendor = await User.create({
            name: 'Test Vendor',
            email: 'vendor@test.com',
            role: 'vendor',
            storeId: store._id,
            isVerified: true,
        });

        // Create test product
        const category = await require('../models/Category').create({
            name: 'Test Category',
            storeId: store._id,
        });

        product = await Product.create({
            storeId: store._id,
            categoryId: category._id,
            name: 'Test Product',
            variants: [
                { weight: '500 g', price: 100, marketPrice: 120, inStock: true },
                { weight: '1 kg', price: 190, marketPrice: 220, inStock: true },
            ],
            image: 'test.jpg',
        });

        token = generateToken(customer._id, 'customer');
    });

    describe('POST /api/orders', () => {
        it('should create order with valid data', async () => {
            const orderData = {
                storeId: store._id,
                items: [
                    {
                        productId: product._id,
                        variantWeight: '500 g',
                        quantity: 2,
                    },
                ],
                deliveryAddress: {
                    fullAddress: 'Test Address',
                    lat: 17.0005,
                    lng: 81.804,
                },
                paymentMethod: 'COD',
            };

            const res = await request(app)
                .post('/api/orders')
                .set('Authorization', `Bearer ${token}`)
                .send(orderData);

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.totalAmount).toBe(200); // 100 * 2
        });

        it('should reject order without storeId', async () => {
            const orderData = {
                items: [
                    {
                        productId: product._id,
                        variantWeight: '500 g',
                        quantity: 1,
                    },
                ],
                deliveryAddress: {
                    fullAddress: 'Test Address',
                },
            };

            const res = await request(app)
                .post('/api/orders')
                .set('Authorization', `Bearer ${token}`)
                .send(orderData);

            expect(res.statusCode).toBe(400);
        });

        it('should reject order with invalid quantity', async () => {
            const orderData = {
                storeId: store._id,
                items: [
                    {
                        productId: product._id,
                        variantWeight: '500 g',
                        quantity: 0,
                    },
                ],
                deliveryAddress: {
                    fullAddress: 'Test Address',
                },
            };

            const res = await request(app)
                .post('/api/orders')
                .set('Authorization', `Bearer ${token}`)
                .send(orderData);

            expect(res.statusCode).toBe(400);
        });

        it('should reject order without authentication', async () => {
            const orderData = {
                storeId: store._id,
                items: [
                    {
                        productId: product._id,
                        variantWeight: '500 g',
                        quantity: 1,
                    },
                ],
                deliveryAddress: {
                    fullAddress: 'Test Address',
                },
            };

            const res = await request(app).post('/api/orders').send(orderData);

            expect(res.statusCode).toBe(401);
        });
    });

    describe('GET /api/orders/history', () => {
        it('should return customer order history', async () => {
            // Create test order
            await Order.create({
                customerId: customer._id,
                storeId: store._id,
                items: [
                    {
                        productId: product._id,
                        name: 'Test Product',
                        price: 100,
                        quantity: 1,
                    },
                ],
                totalAmount: 100,
                deliveryAddress: { fullAddress: 'Test Address' },
                status: 'placed',
            });

            const res = await request(app)
                .get('/api/orders/history')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.length).toBe(1);
        });
    });
});

describe('Authorization Tests', () => {
    let customer, vendor, customerToken, vendorToken, store;

    beforeEach(async () => {
        store = await Store.create({
            name: 'Test Store',
            location: { type: 'Point', coordinates: [81.804, 17.0005] },
            serviceRadiusKm: 5,
            isOpen: true,
        });

        customer = await User.create({
            name: 'Customer',
            email: 'customer@test.com',
            role: 'customer',
        });

        vendor = await User.create({
            name: 'Vendor',
            email: 'vendor@test.com',
            role: 'vendor',
            storeId: store._id,
        });

        customerToken = generateToken(customer._id, 'customer');
        vendorToken = generateToken(vendor._id, 'vendor');
    });

    it('should reject customer accessing vendor routes', async () => {
        const res = await request(app)
            .get('/api/orders/vendor/store-orders')
            .set('Authorization', `Bearer ${customerToken}`);

        expect(res.statusCode).toBe(403);
    });

    it('should allow vendor accessing vendor routes', async () => {
        const res = await request(app)
            .get('/api/orders/vendor/store-orders')
            .set('Authorization', `Bearer ${vendorToken}`);

        expect(res.statusCode).toBe(200);
    });
});

module.exports = app;
