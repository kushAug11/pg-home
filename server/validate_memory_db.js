const { MongoMemoryServer } = require('mongodb-memory-server');

(async () => {
    try {
        const mongod = await MongoMemoryServer.create();
        console.log("Memory Server URI:", mongod.getUri());
        await mongod.stop();
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
