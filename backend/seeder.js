const dotenv = require('dotenv');
dotenv.config();

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
        await User.deleteMany({ role: { $in: ['vendor', 'driver', 'admin'] } });
        console.log('Cleared existing data.');

        // --- Create Admin User ---
        const salt = await bcrypt.genSalt(10);
        const hashedPw = await bcrypt.hash('admin123', salt);
        const adminUser = await User.create({
            name: 'Mubarak Admin',
            email: 'admin@mubarak.com',
            password: hashedPw,
            role: 'admin',
            isVerified: true,
        });
        console.log('✅ Admin user created (email: admin@mubarak.com, password: admin123)');

        // --- Create 3 Stores with Vendors and Delivery Boys ---
        const storesData = [
            {
                name: 'Mubarak Rajahmundry',
                coordinates: [81.804, 17.0005], // [lng, lat]
                address: 'Main Road, Rajahmundry, AP 533101',
                servicePincodes: ['533101', '533103', '533104', '533105'],
                serviceRadiusKm: 5,
                phone: '9876543210',
                vendorEmail: 'vendor1@mubarak.com',
                vendorName: 'Vendor Rajahmundry',
            },
            {
                name: 'Mubarak Kakinada',
                coordinates: [82.2475, 16.9891],
                address: 'Beach Road, Kakinada, AP 533001',
                servicePincodes: ['533001', '533002', '533003'],
                serviceRadiusKm: 5,
                phone: '9876543211',
                vendorEmail: 'vendor2@mubarak.com',
                vendorName: 'Vendor Kakinada',
            },
            {
                name: 'Mubarak Visakhapatnam',
                coordinates: [83.2185, 17.6868],
                address: 'RK Beach Road, Visakhapatnam, AP 530001',
                servicePincodes: ['530001', '530002', '530003', '530004'],
                serviceRadiusKm: 7,
                phone: '9876543212',
                vendorEmail: 'vendor3@mubarak.com',
                vendorName: 'Vendor Visakhapatnam',
            },
        ];

        const stores = [];
        const vendors = [];
        const allDrivers = [];

        for (const storeData of storesData) {
            // Create vendor for this store
            const vendor = await User.create({
                name: storeData.vendorName,
                email: storeData.vendorEmail,
                password: hashedPw,
                role: 'vendor',
                isVerified: true,
            });
            vendors.push(vendor);

            // Create store
            const store = await Store.create({
                name: storeData.name,
                ownerId: vendor._id,
                location: {
                    type: 'Point',
                    coordinates: storeData.coordinates,
                },
                address: storeData.address,
                servicePincodes: storeData.servicePincodes,
                serviceRadiusKm: storeData.serviceRadiusKm,
                isOpen: true,
                phone: storeData.phone,
            });
            stores.push(store);

            // Update vendor with storeId
            vendor.storeId = store._id;
            await vendor.save();

            // Create 2-3 delivery boys for this store
            const driverCount = 2;
            for (let i = 1; i <= driverCount; i++) {
                const driver = await User.create({
                    name: `Driver ${i} - ${store.name}`,
                    phone: `98765432${stores.length}${i}`,
                    role: 'driver',
                    storeId: store._id,
                    isVerified: true,
                });
                allDrivers.push(driver);
            }

            console.log(`✅ Created store: ${store.name}`);
            console.log(`   Vendor: ${vendor.email} (password: admin123)`);
            console.log(`   Delivery boys: ${driverCount}`);
        }

        console.log(`\n✅ Total: ${stores.length} stores, ${vendors.length} vendors, ${allDrivers.length} delivery boys`);

        // --- Create Categories (for first store as example) ---
        const categories = await Category.insertMany([
            {
                name: 'Chicken',
                image: 'https://res.cloudinary.com/demo/image/upload/v1/chicken_category.jpg',
                storeId: stores[0]._id,
            },
            {
                name: 'Boneless',
                image: 'https://res.cloudinary.com/demo/image/upload/v1/boneless_category.jpg',
                storeId: stores[0]._id,
            },
            {
                name: 'Marinated',
                image: 'https://res.cloudinary.com/demo/image/upload/v1/marinated_category.jpg',
                storeId: stores[0]._id,
            },
            {
                name: 'Eggs',
                image: 'https://res.cloudinary.com/demo/image/upload/v1/eggs_category.jpg',
                storeId: stores[0]._id,
            },
        ]);
        console.log(`\n✅ ${categories.length} categories created for ${stores[0].name}`);

        const [chickenCat, bonelessCat, marinatedCat, eggsCat] = categories;

        // --- Create Products (for first store) ---
        const products = await Product.insertMany([
            {
                storeId: stores[0]._id,
                categoryId: chickenCat._id,
                name: 'Curry Cut (Skin)',
                description: 'Fresh • Cleaned • Cut After Order',
                variants: [
                    { weight: '500 g', price: 120, marketPrice: 140, inStock: true },
                    { weight: '1 kg', price: 230, marketPrice: 280, inStock: true, bestValue: true },
                ],
                cutOptions: ['Small Pieces', 'Medium Pieces', 'Large Pieces'],
                image: 'https://res.cloudinary.com/demo/image/upload/v1/curry_cut.jpg',
                images: [
                    'https://res.cloudinary.com/demo/image/upload/v1/curry_cut.jpg',
                    'https://res.cloudinary.com/demo/image/upload/v1/curry_cut_2.jpg',
                    'https://res.cloudinary.com/demo/image/upload/v1/curry_cut_3.jpg',
                    'https://res.cloudinary.com/demo/image/upload/v1/curry_cut_4.jpg'
                ],
                deliveryTime: 18,
            },
            {
                storeId: stores[0]._id,
                categoryId: chickenCat._id,
                name: 'Curry Cut (Skinless)',
                description: 'Fresh • Cleaned • Cut After Order',
                variants: [
                    { weight: '500 g', price: 140, marketPrice: 160, inStock: true },
                    { weight: '1 kg', price: 270, marketPrice: 320, inStock: true, bestValue: true },
                ],
                cutOptions: ['Small Pieces', 'Medium Pieces'],
                image: 'https://res.cloudinary.com/demo/image/upload/v1/curry_cut_skinless.jpg',
                deliveryTime: 18,
            },
            {
                storeId: stores[0]._id,
                categoryId: chickenCat._id,
                name: 'Biryani Cut',
                description: 'Fresh • Cleaned • Cut After Order',
                variants: [
                    { weight: '500 g', price: 130, marketPrice: 150, inStock: true },
                    { weight: '1 kg', price: 250, marketPrice: 300, inStock: true, bestValue: true },
                ],
                cutOptions: ['Standard', 'Large'],
                image: 'https://res.cloudinary.com/demo/image/upload/v1/biryani_cut.jpg',
                deliveryTime: 20,
            },
            {
                storeId: stores[0]._id,
                categoryId: chickenCat._id,
                name: 'Drumsticks',
                description: 'Fresh • Cleaned • Cut After Order',
                variants: [
                    { weight: '250 g', price: 150, marketPrice: 180, inStock: true },
                    { weight: '500 g', price: 280, marketPrice: 340, inStock: true, bestValue: true },
                ],
                cutOptions: [],
                image: 'https://res.cloudinary.com/demo/image/upload/v1/drumsticks.jpg',
                deliveryTime: 18,
            },
            {
                storeId: stores[0]._id,
                categoryId: bonelessCat._id,
                name: 'Boneless (Breast)',
                description: 'Fresh • Cleaned • Cut After Order',
                variants: [
                    { weight: '250 g', price: 190, marketPrice: 220, inStock: true },
                    { weight: '500 g', price: 360, marketPrice: 420, inStock: true, bestValue: true },
                ],
                cutOptions: ['Cubes', 'Strips'],
                image: 'https://res.cloudinary.com/demo/image/upload/v1/boneless_breast.jpg',
                images: [
                    'https://res.cloudinary.com/demo/image/upload/v1/boneless_breast.jpg',
                    'https://res.cloudinary.com/demo/image/upload/v1/boneless_breast_2.jpg',
                    'https://res.cloudinary.com/demo/image/upload/v1/boneless_breast_3.jpg'
                ],
                deliveryTime: 20,
            },
            {
                storeId: stores[0]._id,
                categoryId: bonelessCat._id,
                name: 'Boneless (Thigh)',
                description: 'Fresh • Cleaned • Cut After Order',
                variants: [
                    { weight: '250 g', price: 170, marketPrice: 200, inStock: true },
                    { weight: '500 g', price: 330, marketPrice: 390, inStock: true, bestValue: true },
                ],
                cutOptions: ['Cubes', 'Strips'],
                image: 'https://res.cloudinary.com/demo/image/upload/v1/boneless_thigh.jpg',
                deliveryTime: 20,
            },
            {
                storeId: stores[0]._id,
                categoryId: marinatedCat._id,
                name: 'Tandoori Marinated',
                description: 'Fresh • Cleaned • Cut After Order',
                variants: [
                    { weight: '250 g', price: 210, marketPrice: 240, inStock: true },
                    { weight: '500 g', price: 400, marketPrice: 480, inStock: true, bestValue: true },
                ],
                cutOptions: ['Leg Pieces', 'Mixed'],
                image: 'https://res.cloudinary.com/demo/image/upload/v1/tandoori.jpg',
                deliveryTime: 20,
            },
            {
                storeId: stores[0]._id,
                categoryId: eggsCat._id,
                name: 'Farm Fresh Eggs',
                description: 'Fresh • Cleaned • Cut After Order',
                variants: [
                    { weight: '6 pcs', price: 45, marketPrice: 55, inStock: true },
                    { weight: '12 pcs', price: 85, marketPrice: 105, inStock: true, bestValue: true },
                ],
                cutOptions: [],
                image: 'https://res.cloudinary.com/demo/image/upload/v1/eggs.jpg',
                deliveryTime: 15,
            },
        ]);
        console.log(`✅ ${products.length} products created for ${stores[0].name}\n`);

        console.log('='.repeat(60));
        console.log('✅ SEEDING COMPLETE!');
        console.log('='.repeat(60));
        console.log('\n📋 LOGIN CREDENTIALS:');
        console.log('\nAdmin:');
        console.log('  Email: admin@mubarak.com');
        console.log('  Password: admin123');
        console.log('\nVendors:');
        vendors.forEach((v, i) => {
            console.log(`  ${i + 1}. ${v.email} (password: admin123) - ${stores[i].name}`);
        });
        console.log('\nDelivery Boys:');
        console.log(`  Total: ${allDrivers.length} (phone-based login)`);
        console.log('='.repeat(60));

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error.message);
        console.error(error);
        process.exit(1);
    }
};

seedDB();
