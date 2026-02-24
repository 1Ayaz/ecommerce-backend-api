const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const Store = require('../models/Store');

describe('Store API Tests', () => {
    beforeAll(async () => {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mubarak_test_db');
    });

    afterAll(async () => {
        await Store.deleteMany({});
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        await Store.deleteMany({});
    });

    describe('GET /api/stores/nearby', () => {
        beforeEach(async () => {
            // Create test stores
            await Store.create({
                name: 'Rajahmundry Store',
                ownerId: new mongoose.Types.ObjectId(),
                location: {
                    type: 'Point',
                    coordinates: [81.804, 17.0005] // [lng, lat]
                },
                address: 'Main Road, Rajahmundry',
                servicePincodes: ['533101', '533103'],
                serviceRadiusKm: 5,
                isOpen: true,
                phone: '9876543210'
            });

            await Store.create({
                name: 'Kakinada Store',
                ownerId: new mongoose.Types.ObjectId(),
                location: {
                    type: 'Point',
                    coordinates: [82.2475, 16.9891]
                },
                address: 'Beach Road, Kakinada',
                servicePincodes: ['533001', '533002'],
                serviceRadiusKm: 5,
                isOpen: true,
                phone: '9876543211'
            });
        });

        it('should find store by pincode', async () => {
            const res = await request(app)
                .get('/api/stores/nearby?pincode=533101');

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.name).toBe('Rajahmundry Store');
        });

        it('should find store by coordinates', async () => {
            const res = await request(app)
                .get('/api/stores/nearby?lat=17.0005&lng=81.804');

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.name).toBe('Rajahmundry Store');
        });

        it('should return 404 for unavailable pincode', async () => {
            const res = await request(app)
                .get('/api/stores/nearby?pincode=999999');

            expect(res.statusCode).toBe(404);
            expect(res.body.success).toBe(false);
        });

        it('should return 400 for missing parameters', async () => {
            const res = await request(app)
                .get('/api/stores/nearby');

            expect(res.statusCode).toBe(400);
        });

        it('should only return open stores', async () => {
            // Close Rajahmundry store
            await Store.updateOne(
                { name: 'Rajahmundry Store' },
                { isOpen: false }
            );

            const res = await request(app)
                .get('/api/stores/nearby?pincode=533101');

            expect(res.statusCode).toBe(404);
        });
    });

    describe('GET /api/stores/:id', () => {
        it('should get store by ID', async () => {
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

            const res = await request(app)
                .get(`/api/stores/${store._id}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.name).toBe('Test Store');
        });

        it('should return 404 for non-existent store', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await request(app)
                .get(`/api/stores/${fakeId}`);

            expect(res.statusCode).toBe(404);
        });
    });
});
