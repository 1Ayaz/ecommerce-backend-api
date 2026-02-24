/**
 * Clear all user location data for testing.
 * Run: node clear_locations.js
 */
const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mubarak';

async function clearLocations() {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB Connected:', mongoose.connection.host);

    const User = require('./models/User');

    // Clear savedAddresses for ALL users
    const result = await User.updateMany(
        {},
        { $set: { savedAddresses: [] } }
    );

    console.log(`✅ Cleared savedAddresses for ${result.modifiedCount} users`);

    await mongoose.disconnect();
    console.log('🎉 Done! All user locations cleared.');
}

clearLocations().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
