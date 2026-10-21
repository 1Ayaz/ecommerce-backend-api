const mongoose = require('mongoose');
const User = require('./models/User');
const Store = require('./models/Store');
const Category = require('./models/Category');
const Product = require('./models/Product');
const VendorProduct = require('./models/VendorProduct');
const Order = require('./models/Order');

// ⚠️ REPLACE THIS WITH YOUR NEW RENDER MONGO URI (the one connected to 1ayaz.ve5r89f.mongodb.net)
const LIVE_MONGO_URI = 'mongodb+srv://1Ayaz:YOUR_PASSWORD@1ayaz.ve5r89f.mongodb.net/thefreshcuts?retryWrites=true&w=majority';

// Your local database that has the data
const LOCAL_MONGO_URI = 'mongodb://127.0.0.1:27017/mubarak_db';

const migrateData = async () => {
    let localConnection;
    let liveConnection;

    try {
        console.log('🔄 Connecting to LOCAL database...');
        localConnection = await mongoose.createConnection(LOCAL_MONGO_URI).asPromise();
        console.log('✅ Connected to Local DB');

        console.log('🔄 Connecting to LIVE database...');
        liveConnection = await mongoose.createConnection(LIVE_MONGO_URI).asPromise();
        console.log('✅ Connected to Live DB');

        const collections = ['users', 'stores', 'categories', 'products', 'vendorproducts', 'orders'];
        
        for (const colName of collections) {
            console.log(`\n📦 Migrating collection: ${colName}...`);
            
            // Fetch from local
            const localData = await localConnection.collection(colName).find({}).toArray();
            console.log(`   Found ${localData.length} documents locally.`);

            if (localData.length > 0) {
                // Clear live collection first to avoid duplicates
                await liveConnection.collection(colName).deleteMany({});
                
                // Insert into live
                await liveConnection.collection(colName).insertMany(localData);
                console.log(`   ✅ Successfully copied ${localData.length} documents to Live DB!`);
            } else {
                console.log(`   ⏭️ Skipping (no data found locally).`);
            }
        }

        console.log('\n🎉 MIGRATION COMPLETE! All your old data is now in the live database.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
};

migrateData();
