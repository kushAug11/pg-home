const request = require('supertest');
const app = require('../src/app');
const dbHandler = require('./utils/db-handler');
const User = require('../src/models/User');
const PG = require('../src/models/PG');
const OnboardingAnalytics = require('../src/models/OnboardingAnalytics');
const emailService = require('../src/services/email.service');

// Mock email
jest.mock('../src/services/email.service', () => ({
    sendAccountSetupEmail: jest.fn(),
    sendOTP: jest.fn()
}));

// DB Setup
beforeAll(async () => await dbHandler.connect());
afterEach(async () => await dbHandler.clearDatabase());
afterAll(async () => await dbHandler.closeDatabase());

describe('Enterprise Onboarding & Analytics', () => {
    let ownerToken;
    let pgId;
    let roomId;

    beforeEach(async () => {
        // 1. Register Owner (Should be ACTIVE by default)
        const ownerRes = await request(app).post('/api/auth/register').send({
            name: 'Enterprise Owner',
            email: 'ent_owner@test.com',
            password: 'password123',
            role: 'owner',
            pgName: 'Global PG'
        });
        ownerToken = ownerRes.body.data.token;
        pgId = ownerRes.body.data.pg_id;

        // 2. Upgrade Subscription
        await PG.findByIdAndUpdate(pgId, {
            'subscription.plan': 'Pro',
            'subscription.status': 'active',
            'subscription.expiryDate': new Date(Date.now() + 999999999)
        });

        // 3. Add Room
        const roomRes = await request(app)
            .post('/api/owner/rooms')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ roomNumber: '101', type: 'Single', rent: 5000, capacity: 1 });
        roomId = roomRes.body.data._id;
    });

    it('should create tenant with PENDING_ACTIVATION and log EMAIL_SENT analytics', async () => {
        const res = await request(app)
            .post('/api/owner/tenants')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({
                name: 'Hindi Tenant',
                email: 'hindi@test.com',
                mobile: '9876543210',
                room_id: roomId,
                rentAmount: 5000,
                deposit: 5000,
                preferredLanguage: 'hi' // Requesting Hindi
            });

        expect(res.statusCode).toBe(201);

        // 1. Verify User State
        const user = await User.findOne({ email: 'hindi@test.com' });
        expect(user.accountStatus).toBe('PENDING_ACTIVATION');
        expect(user.preferredLanguage).toBe('hi');

        // 2. Verify Email Service Call (Language Prop)
        // sendAccountSetupEmail(email, name, token, pgName, lang)
        expect(emailService.sendAccountSetupEmail).toHaveBeenCalledWith(
            expect.any(String),
            'Hindi Tenant',
            expect.any(String),
            'Global PG',
            'hi'
        );

        // 3. Verify Analytics Log
        const log = await OnboardingAnalytics.findOne({ tenant_id: user._id, step: 'EMAIL_SENT' });
        expect(log).toBeTruthy();
        expect(log.meta.email).toBe('hindi@test.com');
    });

    it('should block login for PENDING_ACTIVATION users', async () => {
        // Create Tenant first
        await request(app)
            .post('/api/owner/tenants')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({
                name: 'Pending User',
                email: 'pending@test.com',
                mobile: '1234567890',
                room_id: roomId,
                rentAmount: 5000
            });

        // Attempt Login (Expect failure due to PENDING_ACTIVATION status)

        const loginRes = await request(app).post('/api/auth/login').send({
            email: 'pending@test.com',
            password: 'randompassword'
        });

        expect(loginRes.statusCode).toBe(403);
        expect(loginRes.body.message).toContain('Account not activated');
    });

    it('should activate account and log ACTIVATED analytics', async () => {
        // 1. Create Tenant
        await request(app)
            .post('/api/owner/tenants')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({
                name: 'Active User',
                email: 'active@test.com',
                mobile: '1122334455',
                room_id: roomId,
                rentAmount: 5000
            });

        // 2. Get Token
        const call = emailService.sendAccountSetupEmail.mock.calls.find(c => c[0] === 'active@test.com');
        const token = call[2];

        // 3. Activate
        const setupRes = await request(app).post('/api/auth/setup-account').send({
            token,
            password: 'securepassword123'
        });

        expect(setupRes.statusCode).toBe(200);

        // 4. Verify DB State
        const user = await User.findOne({ email: 'active@test.com' });
        expect(user.accountStatus).toBe('ACTIVE');

        // 5. Verify Analytics
        const log = await OnboardingAnalytics.findOne({ tenant_id: user._id, step: 'ACTIVATED' });
        expect(log).toBeTruthy();

        // 6. Verify Login Works
        const loginRes = await request(app).post('/api/auth/login').send({
            email: 'active@test.com',
            password: 'securepassword123'
        });
        expect(loginRes.statusCode).toBe(200);
    });
});
