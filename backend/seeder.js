const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Store = require('./models/Store');
const Category = require('./models/Category');
const Product = require('./models/Product');
const User = require('./models/User');
const VendorProduct = require('./models/VendorProduct');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mubarak_db';

const seedDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB for seeding...\n');

        // ── Clear all existing data ──────────────────────────────────────────
        await VendorProduct.deleteMany({});
        await Product.deleteMany({});
        await Category.deleteMany({});
        await Store.deleteMany({});
        await User.deleteMany({});
        console.log('🗑️  Cleared all existing data.\n');

        // ── Password hash (used for all staff accounts) ──────────────────────
        const salt = await bcrypt.genSalt(10);
        const hashedPw = await bcrypt.hash('admin123', salt);

        // ── 1. Admin ──────────────────────────────────────────────────────
        const admin = await User.create({
            name: 'Mubarak Admin',
            email: 'admin@mubarak.com',
            password: hashedPw,
            role: 'admin',
            isVerified: true,
        });
        console.log('✅ Admin created      → admin@mubarak.com / admin123');

        // ── 3. Vendor (Rajahmundry) ──────────────────────────────────────────
        const vendor = await User.create({
            name: 'Vendor Rajahmundry',
            email: 'vendor@mubarak.com',
            password: hashedPw,
            role: 'vendor',
            isVerified: true,
        });
        console.log('✅ Vendor created     → vendor@mubarak.com / admin123');

        // ── 4. Rajahmundry Store ─────────────────────────────────────────────
        // Center: 17.0005° N, 81.804° E  (Rajahmundry city center)
        // serviceArea: a ~5 km polygon around the city center
        const store = await Store.create({
            name: 'Mubarak Fresh Chicken – Rajahmundry',
            businessName: 'Mubarak Fresh Chicken',
            ownerId: vendor._id,
            city: 'Rajahmundry',
            address: 'Main Road, Rajahmundry, Andhra Pradesh 533101',
            phone: '9876543210',
            isActive: true,
            isOpen: true,
            serviceRadiusKm: 6,
            servicePincodes: ['533101', '533103', '533104', '533105', '533106'],
            location: {
                type: 'Point',
                coordinates: [81.804, 17.0005], // [lng, lat]
            },
            // GeoJSON Polygon — roughly 6 km box around Rajahmundry
            serviceArea: {
                type: 'Polygon',
                coordinates: [[
                    [81.750, 16.960],
                    [81.860, 16.960],
                    [81.860, 17.045],
                    [81.750, 17.045],
                    [81.750, 16.960], // close the ring
                ]],
            },
        });
        console.log(`✅ Store created      → ${store.name}`);

        // Link vendor to store
        vendor.vendorId = store._id;
        await vendor.save();

        // ── 5. Delivery Driver ───────────────────────────────────────────────
        const driver = await User.create({
            name: 'Driver – Rajahmundry',
            email: 'driver@mubarak.com',
            password: hashedPw,
            role: 'driver',
            vendorId: store._id,
            isVerified: true,
        });
        console.log('✅ Driver created     → driver@mubarak.com / admin123\n');

        // ── 6. Categories ────────────────────────────────────────────────────
        const [chickenCat, bonelessCat, marinatedCat, eggsCat] = await Category.insertMany([
            {
                name: 'Chicken',
                image: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=400',
                storeId: store._id,
            },
            {
                name: 'Boneless',
                image: 'https://images.unsplash.com/photo-1604503468506-a8da13d11bea?w=400',
                storeId: store._id,
            },
            {
                name: 'Marinated',
                image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=400',
                storeId: store._id,
            },
            {
                name: 'Eggs',
                image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400',
                storeId: store._id,
            },
        ]);
        console.log('✅ 4 categories created\n');

        // ── 7. Global Product Catalog ────────────────────────────────────────
        // Field names match Product.js schema: variations[].label, variations[].basePrice
        const productsData = [
            {
                categoryId: chickenCat._id,
                name: 'Curry Cut (With Skin)',
                description: 'Fresh • Cleaned • Cut After Order',
                image: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=600',
                images: [
                    'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=600',
                    'https://images.unsplash.com/photo-1604503468506-a8da13d11bea?w=600',
                ],
                variations: [
                    { label: '500g', basePrice: 120, cutOptions: ['Small Pieces', 'Medium Pieces', 'Large Pieces'] },
                    { label: '1kg', basePrice: 230, cutOptions: ['Small Pieces', 'Medium Pieces', 'Large Pieces'] },
                    { label: '2kg', basePrice: 440, cutOptions: ['Small Pieces', 'Medium Pieces', 'Large Pieces'] },
                ],
                createdBy: admin._id,
                approved: true,
            },
            {
                categoryId: chickenCat._id,
                name: 'Curry Cut (Skinless)',
                description: 'Fresh • Cleaned • Cut After Order',
                image: 'https://images.unsplash.com/photo-1604503468506-a8da13d11bea?w=600',
                variations: [
                    { label: '500g', basePrice: 140, cutOptions: ['Small Pieces', 'Medium Pieces'] },
                    { label: '1kg', basePrice: 270, cutOptions: ['Small Pieces', 'Medium Pieces'] },
                    { label: '2kg', basePrice: 520, cutOptions: ['Small Pieces', 'Medium Pieces'] },
                ],
                createdBy: admin._id,
                approved: true,
            },
            {
                categoryId: chickenCat._id,
                name: 'Biryani Cut',
                description: 'Fresh • Cleaned • Cut After Order',
                image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600',
                variations: [
                    { label: '500g', basePrice: 130, cutOptions: ['Standard', 'Large'] },
                    { label: '1kg', basePrice: 250, cutOptions: ['Standard', 'Large'] },
                ],
                createdBy: admin._id,
                approved: true,
            },
            {
                categoryId: chickenCat._id,
                name: 'Drumsticks',
                description: 'Fresh • Cleaned • Cut After Order',
                image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600',
                variations: [
                    { label: '250g', basePrice: 150, cutOptions: [] },
                    { label: '500g', basePrice: 280, cutOptions: [] },
                ],
                createdBy: admin._id,
                approved: true,
            },
            {
                categoryId: chickenCat._id,
                name: 'Whole Chicken',
                description: 'Fresh • Cleaned • Cut After Order',
                image: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=600',
                variations: [
                    { label: '800g–1kg', basePrice: 220, cutOptions: ['Whole', 'Halved', 'Quartered'] },
                    { label: '1kg–1.2kg', basePrice: 260, cutOptions: ['Whole', 'Halved', 'Quartered'] },
                ],
                createdBy: admin._id,
                approved: true,
            },
            {
                categoryId: bonelessCat._id,
                name: 'Boneless Breast',
                description: 'Fresh • Cleaned • Cut After Order',
                image: 'https://images.unsplash.com/photo-1604503468506-a8da13d11bea?w=600',
                variations: [
                    { label: '250g', basePrice: 190, cutOptions: ['Cubes', 'Strips', 'Minced'] },
                    { label: '500g', basePrice: 360, cutOptions: ['Cubes', 'Strips', 'Minced'] },
                ],
                createdBy: admin._id,
                approved: true,
            },
            {
                categoryId: bonelessCat._id,
                name: 'Boneless Thigh',
                description: 'Fresh • Cleaned • Cut After Order',
                image: 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=600',
                variations: [
                    { label: '250g', basePrice: 170, cutOptions: ['Cubes', 'Strips'] },
                    { label: '500g', basePrice: 330, cutOptions: ['Cubes', 'Strips'] },
                ],
                createdBy: admin._id,
                approved: true,
            },
            {
                categoryId: marinatedCat._id,
                name: 'Tandoori Marinated',
                description: 'Marinated with authentic spices • Ready to cook',
                image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600',
                variations: [
                    { label: '250g', basePrice: 210, cutOptions: ['Leg Pieces', 'Mixed'] },
                    { label: '500g', basePrice: 400, cutOptions: ['Leg Pieces', 'Mixed'] },
                ],
                createdBy: admin._id,
                approved: true,
            },
            {
                categoryId: marinatedCat._id,
                name: 'Lemon Herb Marinated',
                description: 'Marinated with lemon & herbs • Ready to cook',
                image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600',
                variations: [
                    { label: '250g', basePrice: 200, cutOptions: ['Breast', 'Thigh'] },
                    { label: '500g', basePrice: 380, cutOptions: ['Breast', 'Thigh'] },
                ],
                createdBy: admin._id,
                approved: true,
            },
            {
                categoryId: eggsCat._id,
                name: 'Farm Fresh Eggs',
                description: 'Farm fresh • Cleaned • Packed',
                image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=600',
                variations: [
                    { label: '6 pcs', basePrice: 45, cutOptions: [] },
                    { label: '12 pcs', basePrice: 85, cutOptions: [] },
                    { label: '30 pcs', basePrice: 200, cutOptions: [] },
                ],
                createdBy: admin._id,
                approved: true,
            },
        ];

        const products = await Product.insertMany(productsData);
        console.log(`✅ ${products.length} products created in global catalog\n`);

        // ── 8. VendorProduct overrides for Rajahmundry store ─────────────────
        // This is what makes products visible with vendor-specific prices
        const vendorOverrides = [];
        for (const product of products) {
            for (const variation of product.variations) {
                vendorOverrides.push({
                    vendorId: store._id,
                    productId: product._id,
                    variationLabel: variation.label,
                    price: variation.basePrice, // same as base for now
                    inStock: true,
                    stockQty: 50,
                    isActive: true,
                });
            }
        }
        await VendorProduct.insertMany(vendorOverrides);
        console.log(`✅ ${vendorOverrides.length} vendor product overrides created\n`);

        // ── Summary ──────────────────────────────────────────────────────────
        console.log('='.repeat(60));
        console.log('🎉 SEEDING COMPLETE!');
        console.log('='.repeat(60));
        console.log('\n📋 LOGIN CREDENTIALS (all passwords: admin123)\n');
        console.log('  Admin      : admin@mubarak.com');
        console.log('  Vendor     : vendor@mubarak.com');
        console.log('  Driver     : driver@mubarak.com');
        console.log('\n🏪 STORE');
        console.log(`  Name       : ${store.name}`);
        console.log(`  Location   : Rajahmundry, AP 533101`);
        console.log(`  Geo-fence  : ~6 km polygon around city center`);
        console.log(`  Products   : ${products.length} items, ${vendorOverrides.length} variations`);
        console.log('\n🧪 TEST NEARBY API:');
        console.log('  GET /api/stores/nearby?lat=17.0005&lng=81.804');
        console.log('='.repeat(60));

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Seeding failed:', error.message);
        console.error(error);
        process.exit(1);
    }
};

seedDB();
