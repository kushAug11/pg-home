const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

let replSet;

// Connect to the in-memory database (Replica Set)
module.exports.connect = async () => {
    replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    const uri = replSet.getUri();
    await mongoose.connect(uri);
};

// Drop database, close the connection and stop replSet
module.exports.closeDatabase = async () => {
    if (replSet) {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
        await replSet.stop();
    }
};

// Remove all the data for all db collections
module.exports.clearDatabase = async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany();
    }
};
