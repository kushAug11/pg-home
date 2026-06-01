const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const PG = require('../src/models/PG');
const Tenant = require('../src/models/Tenant');
const MessMenu = require('../src/models/MessMenu');
const MessAttendance = require('../src/models/MessAttendance');

// Mock Auth Middleware
jest.mock('../src/middlewares/auth.middleware', () => ({
    protect: (req, res, next) => {
        req.user = {
            id: req.headers['user-id'],
            role: req.headers['role'],
            pg_id: req.headers['pg-id']
        };
        next();
    },
    authorize: (...roles) => (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        next();
    }
}));

const { MongoMemoryServer } = require('mongodb-memory-server');

describe('Mess Management Flow', () => {
    let pgId, ownerId, tenantId;
    let mongoServer;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await mongoose.connect(mongoUri);

        pgId = new mongoose.Types.ObjectId();
        ownerId = new mongoose.Types.ObjectId();
        tenantId = new mongoose.Types.ObjectId();

        // Create Mock Tenant for analytics
        await Tenant.create({
            _id: tenantId,
            user_id: new mongoose.Types.ObjectId(),
            pg_id: pgId,
            room_id: new mongoose.Types.ObjectId(),
            rentAmount: 5000,
            status: 'active'
        });
    });

    afterAll(async () => {
        await Tenant.deleteMany({ pg_id: pgId });
        await MessMenu.deleteMany({ pg_id: pgId });
        await MessAttendance.deleteMany({ pg_id: pgId });
        await mongoose.connection.close();
        await mongoServer.stop();
    });

    it('should allow owner to update the menu', async () => {
        const res = await request(app)
            .post('/api/mess/menu')
            .set('user-id', ownerId.toString())
            .set('role', 'owner')
            .set('pg-id', pgId.toString())
            .send({
                date: new Date().toISOString(),
                meals: {
                    breakfast: 'Idli Sambar',
                    lunch: 'Rice Dal',
                    dinner: 'Chapati Curry'
                }
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.meals.breakfast).toBe('Idli Sambar');
    });

    it('should allow tenant to view the menu', async () => {
        const res = await request(app)
            .get('/api/mess/menu')
            .set('user-id', tenantId.toString())
            .set('role', 'tenant')
            .set('pg-id', pgId.toString());

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body[0].meals.lunch).toBe('Rice Dal');
    });

    it('should allow tenant to skip a meal', async () => {
        const res = await request(app)
            .post('/api/mess/attendance')
            .set('user-id', tenantId.toString())
            .set('role', 'tenant')
            .set('pg-id', pgId.toString())
            .send({
                date: new Date().toISOString(),
                meal_type: 'lunch',
                status: 'skipped'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe('skipped');
    });

    it('should show correct analytics to owner', async () => {
        const res = await request(app)
            .get('/api/mess/analytics')
            .set('user-id', ownerId.toString())
            .set('role', 'owner')
            .set('pg-id', pgId.toString())
            .query({ date: new Date().toISOString() });

        expect(res.statusCode).toBe(200);
        const lunchStats = res.body.stats.find(s => s.meal === 'lunch');

        // Total should be 1, Skipped 1, Eating 0
        expect(lunchStats.total).toBe(1);
        expect(lunchStats.skipped).toBe(1);
        expect(lunchStats.eating).toBe(0);
    });
});
