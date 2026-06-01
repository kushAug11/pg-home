
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Complaint = require('../src/models/Complaint');

describe('⚠️ Complaint Model Boundary Tests', () => {
    let mongod;

    beforeAll(async () => {
        mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();
        if (mongoose.connection.readyState !== 0) await mongoose.connection.close();
        await mongoose.connect(uri);
    });

    afterAll(async () => {
        await mongoose.connection.close();
        await mongod.stop();
    });

    afterEach(async () => {
        await Complaint.deleteMany({});
    });

    test('Should reject complaint with missing required fields', async () => {
        const complaint = new Complaint({});
        let err;
        try {
            await complaint.validate();
        } catch (error) {
            err = error;
        }
        expect(err).toBeDefined();
        expect(err.errors.pg_id).toBeDefined();
        expect(err.errors.tenant_id).toBeDefined();
        expect(err.errors.title).toBeDefined();
        expect(err.errors.description).toBeDefined();
    });

    test('Should reject invalid status enum', async () => {
        const complaint = new Complaint({
            pg_id: new mongoose.Types.ObjectId(),
            tenant_id: new mongoose.Types.ObjectId(),
            title: "Test",
            description: "Test Desc",
            status: "InvalidStatus"
        });
        let err;
        try {
            await complaint.validate();
        } catch (error) {
            err = error;
        }
        expect(err).toBeDefined();
        expect(err.errors.status).toBeDefined();
    });

    test('Should reject extremely long title (> 100 chars)', async () => {
        const longTitle = "a".repeat(101);
        const complaint = new Complaint({
            pg_id: new mongoose.Types.ObjectId(),
            tenant_id: new mongoose.Types.ObjectId(),
            title: longTitle, // Should trigger maxlength
            description: "Desc"
        });

        let err;
        try {
            await complaint.validate();
        } catch (e) {
            err = e;
        }
        expect(err).toBeDefined();
        expect(err.errors.title).toBeDefined();
    });

    test('Should reject extremely long description (> 1000 chars)', async () => {
        const longDesc = "a".repeat(1001);
        const complaint = new Complaint({
            pg_id: new mongoose.Types.ObjectId(),
            tenant_id: new mongoose.Types.ObjectId(),
            title: "Short Title",
            description: longDesc // Should trigger maxlength
        });

        let err;
        try {
            await complaint.validate();
        } catch (e) {
            err = e;
        }
        expect(err).toBeDefined();
        expect(err.errors.description).toBeDefined();
    });
});
