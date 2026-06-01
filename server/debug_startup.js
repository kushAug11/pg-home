const mongoose = require('mongoose');
const { MONGODB_URI, NODE_ENV } = require('./src/config/env');

console.log('NODE_ENV:', NODE_ENV);
console.log('MONGODB_URI:', MONGODB_URI);

const connectDB = async () => {
  try {
    console.log('Attempting MongoDB connection...');
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Error:', error.message);

    if (NODE_ENV === 'development') {
      try {
        console.log('⚠️ Attempting fallback to In-Memory Database...');
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();
        console.log('In-Memory URI:', uri);

        await mongoose.connect(uri);
        console.log('⚠️ FALLBACK ACTIVE: Connected to In-Memory Database');
      } catch (fallbackError) {
        console.error('❌ Fallback failed:', fallbackError.message);
        process.exit(1);
      }
    }
  }
};

connectDB().then(() => {
  console.log('Database connected successfully');
  process.exit(0);
}).catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
