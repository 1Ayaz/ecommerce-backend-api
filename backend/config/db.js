const mongoose = require('mongoose');

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;

  try {
    const uri = process.env.NODE_ENV === 'test'
      ? (process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/mubarak_test')
      : process.env.MONGO_URI;

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000, // 10 second timeout
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    if (error.name === 'MongoParseError') {
      console.error('Check if your MONGO_URI is formatted correctly in Render Environment Variables.');
    }
    if (error.message.includes('ETIMEDOUT') || error.message.includes('ENOTFOUND')) {
      console.error('Network Error: Check if you have whitelisted 0.0.0.0/0 in MongoDB Atlas.');
    }
    
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
