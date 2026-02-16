const dotenv = require('dotenv');
dotenv.config({ path: '../.env' });

const mongoose = require('mongoose');
const Store = require('./models/Store');
const Category = require('./models/Category');
const Product = require('./models/Product');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://192.168.0.6:27017/mubarak_db';

const seedDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB for seeding...');

        // Clear existing data
        await Store.deleteMany({});
        await Category.deleteMany({});
        await Product.deleteMany({});
        console.log('Cleared existing data.');

        // --- Create Admin User ---
        const existingAdmin = await User.findOne({ email: 'admin@mubarak.com' });
        let adminUser;
        if (!existingAdmin) {
            const salt = await bcrypt.genSalt(10);
            const hashedPw = await bcrypt.hash('admin123', salt);
            adminUser = await User.create({
                name: 'Mubarak Admin',
                email: 'admin@mubarak.com',
                password: hashedPw,
                role: 'vendor',
                isVerified: true,
            });
            console.log('Admin user created.');
        } else {
            adminUser = existingAdmin;
            console.log('Admin user already exists.');
        }

        // --- Create Store ---
        const store = await Store.create({
            name: 'Mubarak Rajahmundry',
            ownerId: adminUser._id,
            location: {
                type: 'Point',
                coordinates: [81.804, 17.0005], // Rajahmundry approx
            },
            address: 'Main Road, Rajahmundry, AP 533101',
            servicePincodes: ['533101', '533103', '533104', '533105'],
            serviceRadiusKm: 5,
            isOpen: true,
            phone: '9876543210',
        });
        console.log(`Store created: ${store.name}`);

        // --- Create Categories ---
        const categories = await Category.insertMany([
            { name: 'Chicken', image: 'https://res.cloudinary.com/demo/image/upload/v1/chicken_category.jpg', storeId: store._id },
            { name: 'Boneless', image: 'https://res.cloudinary.com/demo/image/upload/v1/boneless_category.jpg', storeId: store._id },
            { name: 'Marinated', image: 'https://res.cloudinary.com/demo/image/upload/v1/marinated_category.jpg', storeId: store._id },
            { name: 'Eggs', image: 'https://res.cloudinary.com/demo/image/upload/v1/eggs_category.jpg', storeId: store._id },
            { name: 'Ready to Cook', image: 'https://res.cloudinary.com/demo/image/upload/v1/rtc_category.jpg', storeId: store._id },
        ]);
        console.log(`${categories.length} categories created.`);

        const chickenCat = categories[0];
        const bonelessCat = categories[1];
        const marinatedCat = categories[2];
        const eggsCat = categories[3];
        const rtcCat = categories[4];

        // --- Create Products ---
        const products = await Product.insertMany([
            {
                storeId: store._id, categoryId: chickenCat._id,
                name: 'Curry Cut (Skin)',
                variants: [
                    { weight: '500 g', price: 120, marketPrice: 140 },
                    { weight: '1 kg', price: 230, marketPrice: 280, bestValue: true }
                ],
                cutOptions: ['Small Pieces', 'Medium Pieces', 'Large Pieces'],
                image: 'https://res.cloudinary.com/demo/image/upload/v1/curry_cut.jpg', deliveryTime: 18,
            },
            {
                storeId: store._id, categoryId: chickenCat._id,
                name: 'Curry Cut (Skinless)',
                variants: [
                    { weight: '500 g', price: 140, marketPrice: 160 },
                    { weight: '1 kg', price: 270, marketPrice: 320, bestValue: true }
                ],
                cutOptions: ['Small Pieces', 'Medium Pieces'],
                image: 'https://res.cloudinary.com/demo/image/upload/v1/curry_cut_skinless.jpg', deliveryTime: 18,
            },
            {
                storeId: store._id, categoryId: chickenCat._id,
                name: 'Biryani Cut',
                variants: [
                    { weight: '500 g', price: 130, marketPrice: 150 },
                    { weight: '1 kg', price: 250, marketPrice: 300, bestValue: true }
                ],
                cutOptions: ['Standard', 'Large'],
                image: 'https://res.cloudinary.com/demo/image/upload/v1/biryani_cut.jpg', deliveryTime: 20,
            },
            {
                storeId: store._id, categoryId: chickenCat._id,
                name: 'Whole Chicken (Cleaned)',
                variants: [
                    { weight: '1 kg', price: 200, marketPrice: 240 }
                ],
                cutOptions: [],
                image: 'https://res.cloudinary.com/demo/image/upload/v1/whole_chicken.jpg', deliveryTime: 15,
            },
            {
                storeId: store._id, categoryId: chickenCat._id,
                name: 'Drumsticks',
                variants: [
                    { weight: '250 g', price: 150, marketPrice: 180 },
                    { weight: '500 g', price: 280, marketPrice: 340, bestValue: true }
                ],
                cutOptions: [],
                image: 'https://res.cloudinary.com/demo/image/upload/v1/drumsticks.jpg', deliveryTime: 18,
            },
            {
                storeId: store._id, categoryId: bonelessCat._id,
                name: 'Boneless (Breast)',
                variants: [
                    { weight: '250 g', price: 190, marketPrice: 220 },
                    { weight: '500 g', price: 360, marketPrice: 420, bestValue: true }
                ],
                cutOptions: ['Cubes', 'Strips'],
                image: 'https://res.cloudinary.com/demo/image/upload/v1/boneless_breast.jpg', deliveryTime: 20,
            },
            {
                storeId: store._id, categoryId: bonelessCat._id,
                name: 'Boneless (Thigh)',
                variants: [
                    { weight: '250 g', price: 170, marketPrice: 200 },
                    { weight: '500 g', price: 330, marketPrice: 390, bestValue: true }
                ],
                cutOptions: ['Cubes', 'Strips'],
                image: 'https://res.cloudinary.com/demo/image/upload/v1/boneless_thigh.jpg', deliveryTime: 20,
            },
            {
                storeId: store._id, categoryId: marinatedCat._id,
                name: 'Tandoori Marinated',
                variants: [
                    { weight: '250 g', price: 210, marketPrice: 240 },
                    { weight: '500 g', price: 400, marketPrice: 480, bestValue: true }
                ],
                cutOptions: ['Leg Pieces', 'Mixed'],
                image: 'https://res.cloudinary.com/demo/image/upload/v1/tandoori.jpg', deliveryTime: 20,
            },
            {
                storeId: store._id, categoryId: eggsCat._id,
                name: 'Farm Fresh Eggs',
                variants: [
                    { weight: '6 pcs', price: 45, marketPrice: 55 },
                    { weight: '12 pcs', price: 85, marketPrice: 105, bestValue: true }
                ],
                cutOptions: [],
                image: 'https://res.cloudinary.com/demo/image/upload/v1/eggs.jpg', deliveryTime: 15,
            },
            {
                storeId: store._id, categoryId: rtcCat._id,
                name: 'Chicken Keema',
                variants: [
                    { weight: '250 g', price: 160, marketPrice: 190 },
                    { weight: '500 g', price: 310, marketPrice: 370, bestValue: true }
                ],
                cutOptions: [],
                image: 'https://res.cloudinary.com/demo/image/upload/v1/keema.jpg', deliveryTime: 20,
            },
        ]);
        console.log(`${products.length} products created.`);

        console.log('\n✅ Seeding complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error.message);
        process.exit(1);
    }
};

seedDB();
