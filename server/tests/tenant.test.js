const request = require('supertest');
const app = require('../src/app');
const dbHandler = require('./utils/db-handler');
const User = require('../src/models/User');
const PG = require('../src/models/PG');
const Room = require('../src/models/Room');
const Tenant = require('../src/models/Tenant');
const Payment = require('../src/models/Payment');
const emailService = require('../src/services/email.service');

// Mock email
jest.mock('../src/services/email.service', () => ({
    sendWelcomeEmail: jest.fn(),
    sendAccountSetupEmail: jest.fn(),
    sendOTP: jest.fn()
}));

// DB Setup
beforeAll(async () => await dbHandler.connect());
afterEach(async () => await dbHandler.clearDatabase());
afterAll(async () => await dbHandler.closeDatabase());

describe('Tenant Routes API', () => {
    let ownerToken;
    let tenantToken;
    let pgId;
    let tenantId;

    beforeEach(async () => {
        // 1. Register Owner
        const ownerRes = await request(app).post('/api/auth/register').send({
            name: 'Landlord',
            email: 'landlord@test.com',
            password: 'password123',
            role: 'owner',
            pgName: 'Happy Stay PG'
        });
        ownerToken = ownerRes.body.data.token;
        pgId = ownerRes.body.data.pg_id;

        // 2. Upgrade Subscription (Crucial for Add Room/Tenant)
        await PG.findByIdAndUpdate(pgId, {
            'subscription.plan': 'Pro',
            'subscription.status': 'active',
            'subscription.expiryDate': new Date(Date.now() + 999999999)
        });

        // 3. Add Room
        const roomRes = await request(app)
            .post('/api/owner/rooms')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ roomNumber: '202', type: 'Double', rent: 5000, capacity: 2 });
        const roomId = roomRes.body.data._id;

        // 4. Add Tenant (Owner Action)
        await request(app)
            .post('/api/owner/tenants')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({
                name: 'Tenant Tim',
                email: 'tim@test.com',
                password: 'ignored_password',
                mobile: '9876543210',
                room_id: roomId,
                rentAmount: 5000,
                deposit: 10000
            });

        // 5. Capture Setup Token from Email Mock
        // emailService.sendAccountSetupEmail(email, name, token, pgName)
        const emailCall = emailService.sendAccountSetupEmail.mock.calls.find(call => call[0] === 'tim@test.com');
        const setupToken = emailCall ? emailCall[2] : null;

        if (!setupToken) {
            throw new Error('Setup Token not found in email mock calls');
        }

        // 6. Setup Account (Simulate Tenant clicking link and setting password)
        await request(app).post('/api/auth/setup-account').send({
            token: setupToken,
            password: 'newSecurePassword123'
        });

        // 7. Tenant Login (To get Token)
        const loginRes = await request(app).post('/api/auth/login').send({
            email: 'tim@test.com',
            password: 'newSecurePassword123'
        });

        tenantToken = loginRes.body.data.token;
        tenantId = loginRes.body.data._id;
    });

    describe('GET /api/tenant/dashboard', () => {
        it('should return dashboard stats', async () => {
            const res = await request(app)
                .get('/api/tenant/dashboard')
                .set('Authorization', `Bearer ${tenantToken}`);

            if (res.statusCode !== 200) {
                console.log('Dashboard Error', JSON.stringify(res.body, null, 2));
            }
            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.tenant.rentAmount).toBe(5000);
        });
    });

    // Optional: Payment history test if the endpoint exists
});
