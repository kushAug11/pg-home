const request = require('supertest');
const app = require('../src/app');
const dbHandler = require('./utils/db-handler');
const User = require('../src/models/User');
const PG = require('../src/models/PG');
const Room = require('../src/models/Room');
const Tenant = require('../src/models/Tenant');
const Notice = require('../src/models/Notice');

// Mock email to avoid logs
jest.mock('../src/services/email.service', () => ({
    sendWelcomeEmail: jest.fn(),
}));

// Setup Test DB
beforeAll(async () => await dbHandler.connect());
afterEach(async () => await dbHandler.clearDatabase());
afterAll(async () => await dbHandler.closeDatabase());

describe('Owner Routes API', () => {
    let ownerToken;
    let pgId;
    let roomId;

    beforeEach(async () => {
        // Create Owner & PG for each test (since we clear DB)
        const ownerRes = await request(app).post('/api/auth/register').send({
            name: 'Test Owner',
            email: 'owner@test.com',
            password: 'password123',
            role: 'owner',
            pgName: 'Sunshine PG'
        });

        ownerToken = ownerRes.body.data.token;
        pgId = ownerRes.body.data.pg_id;

        // Manually upgrade subscription for testing
        await PG.findByIdAndUpdate(pgId, {
            'subscription.plan': 'Pro',
            'subscription.status': 'active',
            'subscription.startDate': new Date(),
            'subscription.expiryDate': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });
    });

    describe('POST /api/owner/rooms', () => {
        it('should add a room successfully', async () => {
            const res = await request(app)
                .post('/api/owner/rooms')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    roomNumber: '101',
                    type: 'Single',
                    rent: 5000,
                    capacity: 1
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            roomId = res.body.data._id;
        });
    });

    describe('POST /api/owner/notices', () => {
        it('should create a notice successfully (fixing user reported error)', async () => {
            const res = await request(app)
                .post('/api/owner/notices')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    title: 'Urgent Maintenance',
                    message: 'Water tank cleaning tomorrow',
                    type: 'Urgent' // Valid Enum
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
        });

        it('should accept lowercase type due to schema fix', async () => {
            const res = await request(app)
                .post('/api/owner/notices')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    title: 'Friendly info',
                    message: 'Welcome everyone',
                    type: 'info' // Lowercase, previously failed
                });

            expect(res.statusCode).toBe(201);
        });
    });

    describe('POST /api/owner/tenants', () => {
        it('should add a tenant to the room', async () => {
            // Need a room first
            const roomRes = await request(app)
                .post('/api/owner/rooms')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ roomNumber: '202', type: 'Single', rent: 5000, capacity: 1 });
            const myRoomId = roomRes.body.data._id;

            const res = await request(app)
                .post('/api/owner/tenants')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    name: 'John Tenant',
                    email: 'tenant@test.com',
                    password: 'password123',
                    mobile: '9876543210',
                    room_id: myRoomId,
                    rentAmount: 5000,
                    deposit: 10000
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
        });
    });
});
