const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

describe('Sanity Check', () => {
    let mongoServer;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        await mongoose.connect(mongoServer.getUri());
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    test('should connect to in-memory db', async () => {
        const Cat = mongoose.model('Cat', new mongoose.Schema({ name: String }));
        await Cat.create({ name: 'Zildjian' });
        const kitty = await Cat.findOne({ name: 'Zildjian' });
        expect(kitty.name).toBe('Zildjian');
    });
});
