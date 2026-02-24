const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const Store = require('./models/Store');
const Product = require('./models/Product');
const Order = require('./models/Order');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        const userCount = await User.countDocuments();
        const storeCount = await Store.countDocuments();
        const productCount = await Product.countDocuments();
        const orderCount = await Order.countDocuments();

        console.log('--- SYSTEM STATUS REPORT ---');
        console.log(`Users: ${userCount}`);
        console.log(`Stores: ${storeCount}`);
        console.log(`Products: ${productCount}`);
        console.log(`Orders: ${orderCount}`);
        console.log('----------------------------');

        if (storeCount === 0) {
            console.warn('WARNING: No stores found. Did the DB get wiped or is this a new instance?');
        } else {
            const stores = await Store.find().select('name isActive');
            console.log('Stores found:', stores);
        }

        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

connectDB();
