const mongoose = require('mongoose');

const ACTIVE_ATLAS_URI = 'mongodb+srv://1Ayaz:Ayaz%40mongodb@1ayaz.ve5r89f.mongodb.net/test?retryWrites=true&w=majority';

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;

  let uri = process.env.NODE_ENV === 'test'
    ? (process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/tfc_test')
    : (process.env.MONGO_URI || ACTIVE_ATLAS_URI);

  // Auto-fallback if environment variable still points to the old dead cluster
  if (uri.includes('mubarak-db.4yokest.mongodb.net')) {
    console.warn('⚠️ Detected legacy/paused cluster URL in MONGO_URI. Redirecting to active Atlas cluster (1ayaz.ve5r89f.mongodb.net/test)...');
    uri = ACTIVE_ATLAS_URI;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host} (DB: ${conn.connection.name})`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
  }
};

module.exports = connectDB;
