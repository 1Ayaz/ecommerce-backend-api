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
                name: 'Curry Cut (Skin)', price: 220, marketPrice: 260,
                weightLabel: '1 kg', cutOptions: ['Small Pieces', 'Medium Pieces', 'Large Pieces'],
                image: 'https://res.cloudinary.com/demo/image/upload/v1/curry_cut.jpg', deliveryTime: 18,
            },
            {
                storeId: store._id, categoryId: chickenCat._id,
                name: 'Curry Cut (Skinless)', price: 250, marketPrice: 290,
                weightLabel: '1 kg', cutOptions: ['Small Pieces', 'Medium Pieces'],
                image: 'https://res.cloudinary.com/demo/image/upload/v1/curry_cut_skinless.jpg', deliveryTime: 18,
            },
            {
                storeId: store._id, categoryId: chickenCat._id,
                name: 'Biryani Cut', price: 240, marketPrice: 280,
                weightLabel: '1 kg', cutOptions: ['Standard', 'Large'],
                image: 'https://res.cloudinary.com/demo/image/upload/v1/biryani_cut.jpg', deliveryTime: 20,
            },
            {
                storeId: store._id, categoryId: chickenCat._id,
                name: 'Whole Chicken (Cleaned)', price: 200, marketPrice: 240,
                weightLabel: '1 kg', cutOptions: [],
                image: 'https://res.cloudinary.com/demo/image/upload/v1/whole_chicken.jpg', deliveryTime: 15,
            },
            {
                storeId: store._id, categoryId: chickenCat._id,
                name: 'Drumsticks', price: 280, marketPrice: 330,
                weightLabel: '500 g', cutOptions: [],
                image: 'https://res.cloudinary.com/demo/image/upload/v1/drumsticks.jpg', deliveryTime: 18,
            },
            {
                storeId: store._id, categoryId: bonelessCat._id,
                name: 'Boneless (Breast)', price: 350, marketPrice: 400,
                weightLabel: '500 g', cutOptions: ['Cubes', 'Strips'],
                image: 'https://res.cloudinary.com/demo/image/upload/v1/boneless_breast.jpg', deliveryTime: 20,
            },
            {
                storeId: store._id, categoryId: bonelessCat._id,
                name: 'Boneless (Thigh)', price: 320, marketPrice: 370,
                weightLabel: '500 g', cutOptions: ['Cubes', 'Strips'],
                image: 'https://res.cloudinary.com/demo/image/upload/v1/boneless_thigh.jpg', deliveryTime: 20,
            },
            {
                storeId: store._id, categoryId: marinatedCat._id,
                name: 'Tandoori Marinated', price: 380, marketPrice: 450,
                weightLabel: '500 g', cutOptions: ['Leg Pieces', 'Mixed'],
                image: 'https://res.cloudinary.com/demo/image/upload/v1/tandoori.jpg', deliveryTime: 20,
            },
            {
                storeId: store._id, categoryId: eggsCat._id,
                name: 'Farm Fresh Eggs', price: 80, marketPrice: 96,
                weightLabel: '12 pcs', cutOptions: [], isVeg: true,
                image: 'https://res.cloudinary.com/demo/image/upload/v1/eggs.jpg', deliveryTime: 15,
            },
            {
                storeId: store._id, categoryId: rtcCat._id,
                name: 'Chicken Keema', price: 300, marketPrice: 350,
                weightLabel: '500 g', cutOptions: [],
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
