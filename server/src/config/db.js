const mongoose = require('mongoose');
const { MONGODB_URI, NODE_ENV } = require('./env');

const connectDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        const maskedURI = MONGODB_URI.replace(/:([^:@]+)@/, ':****@');
        console.log(`✅ MongoDB Connected Successfully (${maskedURI.includes('localhost') || maskedURI.includes('127.0.0.1') ? 'Local' : 'Cloud'})`);
    } catch (error) {
        console.error('❌ Failed to connect to MongoDB:', error.message);

        // FALLBACK STRATEGY
        if (NODE_ENV === 'development' || NODE_ENV === 'test') {
            console.error('❌ CLOUD MONGODB CONNECTION FAILED');
            console.error('👉 ACTION REQUIRED: Check your IP Whitelist in MongoDB Atlas.');
            console.error('   Network Error:', error.message);

            // We will STILL try fallback so the app works, but the error above is critical.
            // If the user wants ONLY cloud, they should fix the IP.

            // 1. Try Local Persistent MongoDB
            try {
                console.log('🔄 Attempting connection to Local Persistent MongoDB (mongodb://127.0.0.1:27017/hostel_local)...');
                await mongoose.connect('mongodb://127.0.0.1:27017/hostel_local');
                console.log('✅ Connected to Local Persistent MongoDB.');
                console.log('   (Data WILL persist across restarts)');
                return;
            } catch (localError) {
                console.warn('⚠️ Local MongoDB failed:', localError.message);
            }

            // 2. Last Resort: In-Memory
            try {
                console.log('⚠️ Attempting fallback to In-Memory Database...');
                const { MongoMemoryServer } = require('mongodb-memory-server');
                const mongod = await MongoMemoryServer.create();
                const uri = mongod.getUri();

                await mongoose.connect(uri);
                console.log('⚠️ FALLBACK ACTIVE: Connected to In-Memory Database.');
                console.log('   (Data will vanish when server restarts)');
            } catch (fallbackError) {
                console.error('❌ Fallback failed:', fallbackError.message);
                process.exit(1);
            }
        } else {
            console.error('❌ CRITICAL: MongoDB Connection Failed in Production/Test.');
            // Do not exit, let it retry or stay up (though API will fail) - better for debugging logs
            // process.exit(1); 
        }
    }
};

module.exports = connectDB;
