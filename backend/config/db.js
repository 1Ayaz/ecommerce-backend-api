const mongoose = require('mongoose');

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;

  const uri = process.env.NODE_ENV === 'test'
    ? (process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/tfc_test')
    : process.env.MONGO_URI;

  if (!uri) {
    console.error('❌ CRITICAL: MONGO_URI is not defined in environment variables!');
    console.error('Go to Render Dashboard -> Environment and add MONGO_URI.');
    return;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    if (error.message.includes('ENOTFOUND')) {
      console.error('🚨 MONGODB ATLAS CLUSTER MAY BE PAUSED: MongoDB Atlas Free M0 clusters auto-pause after inactivity. Please go to cloud.mongodb.com and click Resume on your cluster.');
    }
  }
};

module.exports = connectDB;
