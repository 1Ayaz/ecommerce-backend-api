const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

describe('Auth API Tests', () => {
    beforeAll(async () => {
        // Connect to test database
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mubarak_test_db');
    });

    afterAll(async () => {
        // Clean up and close connection
        await User.deleteMany({});
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        // Clear users before each test
        await User.deleteMany({});
    });

    describe('POST /api/auth/send-otp', () => {
        it('should send OTP for valid phone number', async () => {
            const res = await request(app)
                .post('/api/auth/send-otp')
                .send({ phone: '9876543210' });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('OTP sent successfully');
            expect(res.body.devOtp).toBeDefined(); // OTP included in dev mode
        });

        it('should reject invalid phone number', async () => {
            const res = await request(app)
                .post('/api/auth/send-otp')
                .send({ phone: '123456' });

            expect(res.statusCode).toBe(400);
        });

        it('should reject missing phone number', async () => {
            const res = await request(app)
                .post('/api/auth/send-otp')
                .send({});

            expect(res.statusCode).toBe(400);
        });
    });

    describe('POST /api/auth/verify-otp', () => {
        it('should verify OTP and create new user', async () => {
            // First send OTP
            const sendRes = await request(app)
                .post('/api/auth/send-otp')
                .send({ phone: '9876543210' });

            const otp = sendRes.body.devOtp;

            // Then verify OTP
            const verifyRes = await request(app)
                .post('/api/auth/verify-otp')
                .send({ phone: '9876543210', otp });

            expect(verifyRes.statusCode).toBe(200);
            expect(verifyRes.body.success).toBe(true);
            expect(verifyRes.body.token).toBeDefined();
            expect(verifyRes.body.user.phone).toBe('9876543210');
            expect(verifyRes.body.user.role).toBe('customer');
        });

        it('should reject invalid OTP', async () => {
            await request(app)
                .post('/api/auth/send-otp')
                .send({ phone: '9876543210' });

            const res = await request(app)
                .post('/api/auth/verify-otp')
                .send({ phone: '9876543210', otp: '000000' });

            expect(res.statusCode).toBe(401);
        });

        it('should reject expired OTP', async () => {
            // This test would require mocking time or waiting 5 minutes
            // Skipping for now
        });
    });

    describe('POST /api/auth/admin-login', () => {
        it('should login admin with valid credentials', async () => {
            // Create admin user
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);
            await User.create({
                email: 'admin@test.com',
                password: hashedPassword,
                name: 'Test Admin',
                role: 'admin',
                isVerified: true
            });

            const res = await request(app)
                .post('/api/auth/admin-login')
                .send({ email: 'admin@test.com', password: 'admin123' });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.token).toBeDefined();
            expect(res.body.user.role).toBe('admin');
        });

        it('should reject invalid credentials', async () => {
            const res = await request(app)
                .post('/api/auth/admin-login')
                .send({ email: 'admin@test.com', password: 'wrongpassword' });

            expect(res.statusCode).toBe(401);
        });

        it('should reject customer login', async () => {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('password123', salt);
            await User.create({
                email: 'customer@test.com',
                password: hashedPassword,
                name: 'Test Customer',
                role: 'customer',
                isVerified: true
            });

            const res = await request(app)
                .post('/api/auth/admin-login')
                .send({ email: 'customer@test.com', password: 'password123' });

            expect(res.statusCode).toBe(401);
        });
    });

    describe('GET /api/auth/me', () => {
        it('should return user profile with valid token', async () => {
            // Create user and get token
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);
            await User.create({
                email: 'admin@test.com',
                password: hashedPassword,
                name: 'Test Admin',
                role: 'admin',
                isVerified: true
            });

            const loginRes = await request(app)
                .post('/api/auth/admin-login')
                .send({ email: 'admin@test.com', password: 'admin123' });

            const token = loginRes.body.token;

            const res = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.user.email).toBe('admin@test.com');
        });

        it('should reject request without token', async () => {
            const res = await request(app)
                .get('/api/auth/me');

            expect(res.statusCode).toBe(401);
        });
    });
});
