const dbHandler = require('./utils/db-handler');
const mongoose = require('mongoose');

beforeAll(async () => await dbHandler.connect());
afterEach(async () => await dbHandler.clearDatabase());
afterAll(async () => await dbHandler.closeDatabase());

describe('In-Memory DB Check', () => {
    it('should connect and perform basic operations', async () => {
        const Schema = new mongoose.Schema({ name: String });
        const Model = mongoose.model('Test', Schema);

        await Model.create({ name: 'Jest' });
        const doc = await Model.findOne({ name: 'Jest' });

        expect(doc.name).toBe('Jest');
    });
});
