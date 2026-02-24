const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Store = require('../models/Store');
const Product = require('../models/Product');
const Category = require('../models/Category');
const jwt = require('jsonwebtoken');

const MONGO_URI_TEST = process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/mubarak_test';

beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(MONGO_URI_TEST);
    }
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
});

afterEach(async () => {
    await User.deleteMany({});
    await Store.deleteMany({});
    await Product.deleteMany({});
    await Category.deleteMany({});
});

const generateToken = (userId, role) => {
    return jwt.sign({ id: userId, role }, process.env.JWT_ACCESS_SECRET, { expiresIn: '1h' });
};

describe('Dashboard Integration Tests', () => {
    let adminToken, vendorToken, store, category;

    beforeEach(async () => {
        const admin = await User.create({
            name: 'Admin',
            email: 'admin@test.com',
            role: 'admin',
            isVerified: true
        });
        adminToken = generateToken(admin._id, 'admin');

        store = await Store.create({
            name: 'Main Store',
            location: { type: 'Point', coordinates: [81.8, 17.0] },
            address: '123 Test St',
            servicePincodes: ['533101']
        });

        const vendor = await User.create({
            name: 'Vendor',
            email: 'vendor@test.com',
            role: 'vendor',
            storeId: store._id,
            isVerified: true
        });
        vendorToken = generateToken(vendor._id, 'vendor');

        category = await Category.create({
            name: 'Chicken',
            image: 'cat.jpg',
            storeId: store._id
        });
    });

    describe('Admin Store Management', () => {
        it('should allow admin to create a store', async () => {
            const res = await request(app)
                .post('/api/stores')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'New Store',
                    address: '456 Branch St',
                    servicePincodes: ['533102'],
                    phone: '9988776655',
                    location: { type: 'Point', coordinates: [81.9, 17.1] }
                });
            expect(res.statusCode).toBe(201);
            expect(res.body.data.name).toBe('New Store');
        });

        it('should prevent vendor from creating a store', async () => {
            const res = await request(app)
                .post('/api/stores')
                .set('Authorization', `Bearer ${vendorToken}`)
                .send({ name: 'Illegal Store', servicePincodes: ['000000'], phone: '9000000000' });
            expect(res.statusCode).toBe(403);
        });
    });

    describe('Admin User Management', () => {
        it('should allow admin to create a vendor', async () => {
            const res = await request(app)
                .post('/api/auth/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'New Vendor',
                    email: 'newvendor@test.com',
                    phone: '9123456780',
                    password: 'password123',
                    role: 'vendor',
                    storeId: store._id
                });
            expect(res.statusCode).toBe(201);
            expect(res.body.data.role).toBe('vendor');
        });

        it('should allow admin to list all staff', async () => {
            const res = await request(app)
                .get('/api/auth/users')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.statusCode).toBe(200);
            expect(res.body.data.length).toBeGreaterThan(0);
        });
    });

    describe('Product Management (Vendor/Admin)', () => {
        it('should allow vendor to create a product in their store', async () => {
            const res = await request(app)
                .post('/api/products')
                .set('Authorization', `Bearer ${vendorToken}`)
                .send({
                    name: 'Skinless Chicken',
                    categoryId: category._id,
                    image: 'chicken.jpg',
                    variants: [{ weight: '500g', price: 150 }]
                });
            expect(res.statusCode).toBe(201);
            expect(res.body.data.name).toBe('Skinless Chicken');
        });

        it('should prevent vendor from updating product of another store', async () => {
            const otherStore = await Store.create({ name: 'Other', location: { type: 'Point', coordinates: [0, 0] }, servicePincodes: ['111'] });
            const otherProduct = await Product.create({
                name: 'Other Product',
                storeId: otherStore._id,
                categoryId: category._id,
                image: 'x.jpg',
                variants: [{ weight: '1kg', price: 300 }]
            });

            const res = await request(app)
                .put(`/api/products/${otherProduct._id}`)
                .set('Authorization', `Bearer ${vendorToken}`)
                .send({ name: 'Hacked Name' });
            expect(res.statusCode).toBe(403);
        });
    });
});
