const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' }); // Adjust path if needed

const URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hostel_local';

const cleanDb = async () => {
    try {
        console.log(`🔌 Connecting to: ${URI.split('@')[1] || 'Local/Unknown'}...`);

        // 5 Second Connection Timeout
        await mongoose.connect(URI, { serverSelectionTimeoutMS: 5000 });
        console.log('✅ Connected.');

        const tenants = mongoose.connection.collection('tenants');
        const rooms = mongoose.connection.collection('rooms');

        // 1. Delete Corrupt Tenants
        const res1 = await tenants.deleteMany({ room_id: { $regex: /PLACEHOLDER/i } });
        console.log(`🗑️ Deleted ${res1.deletedCount} tenants with PLACEHOLDER room_id.`);

        // 2. Delete Corrupt Rooms
        const res2 = await rooms.deleteMany({ _id: { $regex: /PLACEHOLDER/i } });
        console.log(`🗑️ Deleted ${res2.deletedCount} rooms with PLACEHOLDER _id.`);

        // 3. Delete Bad ID formats (String instead of ObjectId)
        // This is harder to query directly if types are mixed, but regex match on non-hex might work
        // or just focus on known bad strings.

    } catch (error) {
        console.error('❌ cleanup failed:', error.message);
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
            console.log('👋 Connection closed.');
        }
        process.exit(0);
    }
};

cleanDb();
