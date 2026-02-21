/**
 * Migration: Generate slugs for all existing products that don't have one.
 * Run once: node backend/migrate_slugs.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

async function migrate() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const products = await Product.find({ $or: [{ slug: null }, { slug: '' }, { slug: { $exists: false } }] });
    console.log(`Found ${products.length} products without slugs`);

    for (const product of products) {
        // Triggering save will fire the pre-save hook which generates the slug
        await product.save();
        console.log(`  ✅ ${product.name} → /${product.slug}`);
    }

    console.log('Migration complete!');
    await mongoose.disconnect();
}

migrate().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
