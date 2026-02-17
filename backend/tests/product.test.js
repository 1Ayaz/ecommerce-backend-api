const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const Store = require('../models/Store');
const Product = require('../models/Product');
const Category = require('../models/Category');

describe('Product API Tests', () => {
    let storeId, categoryId;

    beforeAll(async () => {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://192.168.0.6:27017/mubarak_test_db');

        // Create test store
        const store = await Store.create({
            name: 'Test Store',
            ownerId: new mongoose.Types.ObjectId(),
            location: {
                type: 'Point',
                coordinates: [81.804, 17.0005]
            },
            address: 'Test Address',
            servicePincodes: ['533101'],
            serviceRadiusKm: 5,
            phone: '9876543210'
        });
        storeId = store._id;

        // Create test category
        const category = await Category.create({
            name: 'Test Category',
            image: 'https://example.com/image.jpg',
            storeId: storeId
        });
        categoryId = category._id;
    });

    afterAll(async () => {
        await Product.deleteMany({});
        await Category.deleteMany({});
        await Store.deleteMany({});
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        await Product.deleteMany({});
    });

    describe('GET /api/products', () => {
        it('should get all products for a store', async () => {
            // Create test products
            await Product.create({
                storeId,
                categoryId,
                name: 'Test Product 1',
                variants: [{ weight: '500g', price: 100, inStock: true }],
                image: 'https://example.com/product1.jpg'
            });

            await Product.create({
                storeId,
                categoryId,
                name: 'Test Product 2',
                variants: [{ weight: '1kg', price: 200, inStock: true }],
                image: 'https://example.com/product2.jpg'
            });

            const res = await request(app)
                .get(`/api/products?storeId=${storeId}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveLength(2);
        });

        it('should filter products by category', async () => {
            await Product.create({
                storeId,
                categoryId,
                name: 'Test Product',
                variants: [{ weight: '500g', price: 100, inStock: true }],
                image: 'https://example.com/product.jpg'
            });

            const res = await request(app)
                .get(`/api/products?storeId=${storeId}&categoryId=${categoryId}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.data).toHaveLength(1);
            expect(res.body.data[0].categoryId.toString()).toBe(categoryId.toString());
        });

        it('should return empty array for non-existent store', async () => {
            const fakeStoreId = new mongoose.Types.ObjectId();
            const res = await request(app)
                .get(`/api/products?storeId=${fakeStoreId}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.data).toHaveLength(0);
        });
    });

    describe('GET /api/products/:id', () => {
        it('should get product by ID', async () => {
            const product = await Product.create({
                storeId,
                categoryId,
                name: 'Test Product',
                description: 'Test Description',
                variants: [
                    { weight: '500g', price: 100, marketPrice: 120, inStock: true },
                    { weight: '1kg', price: 190, marketPrice: 220, inStock: true, bestValue: true }
                ],
                cutOptions: ['Small', 'Medium', 'Large'],
                image: 'https://example.com/product.jpg',
                deliveryTime: 20
            });

            const res = await request(app)
                .get(`/api/products/${product._id}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.name).toBe('Test Product');
            expect(res.body.data.variants).toHaveLength(2);
            expect(res.body.data.cutOptions).toHaveLength(3);
        });

        it('should return 404 for non-existent product', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await request(app)
                .get(`/api/products/${fakeId}`);

            expect(res.statusCode).toBe(404);
        });
    });

    describe('GET /api/products/categories', () => {
        it('should get all categories for a store', async () => {
            await Category.create({
                name: 'Category 2',
                image: 'https://example.com/cat2.jpg',
                storeId: storeId
            });

            const res = await request(app)
                .get(`/api/products/categories?storeId=${storeId}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.length).toBeGreaterThanOrEqual(2);
        });
    });
});
