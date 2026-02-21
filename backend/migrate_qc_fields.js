/**
 * Migration: Add Quick Commerce fields to existing Categories and Products
 *
 * ⚠ Run once: node migrate_qc_fields.js
 * This script ONLY adds default values — it never deletes or overwrites existing data.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');

async function migrate() {
    await connectDB();

    const Category = require('./models/Category');
    const Product = require('./models/Product');

    console.log('🔄 Migrating Categories…');
    const categories = await Category.find();
    let catCount = 0;
    for (const cat of categories) {
        let changed = false;
        if (!cat.slug) { changed = true; } // pre-save hook will generate
        if (cat.isActive === undefined) { cat.isActive = true; changed = true; }
        if (cat.order === undefined) { cat.order = 0; changed = true; }
        if (changed) {
            await cat.save();
            catCount++;
        }
    }
    console.log(`  ✅ ${catCount}/${categories.length} categories updated`);

    console.log('🔄 Migrating Products…');
    const products = await Product.find();
    let prodCount = 0;
    for (const p of products) {
        let changed = false;
        if (p.isFeatured === undefined) { p.isFeatured = false; changed = true; }
        if (!p.shortDescription) { p.shortDescription = ''; changed = true; }
        if (!p.fullDescription) { p.fullDescription = ''; changed = true; }
        if (p.showShortDescription === undefined) { p.showShortDescription = true; changed = true; }
        if (p.showFullDescription === undefined) { p.showFullDescription = true; changed = true; }
        if (p.showSellerDetails === undefined) { p.showSellerDetails = false; changed = true; }
        if (p.shareEnabled === undefined) { p.shareEnabled = true; changed = true; }
        if (p.wishlistEnabled === undefined) { p.wishlistEnabled = true; changed = true; }

        // Migrate variations
        if (p.variations && p.variations.length > 0) {
            p.variations.forEach((v) => {
                if (!v.price) { v.price = v.basePrice; changed = true; }
                if (v.stock === undefined) { v.stock = 0; changed = true; }
                if (v.isActive === undefined) { v.isActive = true; changed = true; }
            });
        }

        if (changed) {
            await p.save();
            prodCount++;
        }
    }
    console.log(`  ✅ ${prodCount}/${products.length} products updated`);

    console.log('🎉 Migration complete!');
    process.exit(0);
}

migrate().catch((err) => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
});
