const request = require('supertest');
const app = require('../src/app');
const dbHandler = require('./utils/db-handler');
const User = require('../src/models/User');
const PG = require('../src/models/PG');
const Room = require('../src/models/Room');
const Tenant = require('../src/models/Tenant');
const PreAuthVisitor = require('../src/models/PreAuthVisitor');
const Visitor = require('../src/models/Visitor');
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

describe('Pre-Authorized Visitor System Integration Tests', () => {
    let ownerToken;
    let tenantToken;
    let pgId;
    let tenantRecord;

    beforeEach(async () => {
        jest.clearAllMocks();
        // 1. Register Owner
        const ownerRes = await request(app).post('/api/auth/register').send({
            name: 'Landlord Tim',
            email: 'landlord@test.com',
            password: 'password123',
            role: 'owner',
            pgName: 'Green Meadows PG'
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
            .send({ roomNumber: '101', type: 'Single', rent: 6000, capacity: 1 });
        const roomId = roomRes.body.data._id;

        // 4. Add Tenant
        await request(app)
            .post('/api/owner/tenants')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({
                name: 'Resident Ron',
                email: 'ron@test.com',
                password: 'ignored_password',
                mobile: '9988776655',
                room_id: roomId,
                rentAmount: 6000,
                deposit: 12000
            });

        // 5. Capture Setup Token from Email Mock
        const emailCall = emailService.sendAccountSetupEmail.mock.calls.find(call => call[0] === 'ron@test.com');
        const setupToken = emailCall ? emailCall[2] : null;

        if (!setupToken) {
            throw new Error('Setup Token not found in email mock calls');
        }

        // 6. Setup Account
        await request(app).post('/api/auth/setup-account').send({
            token: setupToken,
            password: 'newSecurePassword123'
        });

        // 7. Tenant Login
        const loginRes = await request(app).post('/api/auth/login').send({
            email: 'ron@test.com',
            password: 'newSecurePassword123'
        });

        tenantToken = loginRes.body.data.token;
        tenantRecord = await Tenant.findOne({ user_id: loginRes.body.data._id });
    });

    describe('Tenant: Pre-Authorization Operations', () => {
        it('should allow tenant to create a pre-authorized visitor pass', async () => {
            const res = await request(app)
                .post('/api/tenant/preauth-visitors')
                .set('Authorization', `Bearer ${tenantToken}`)
                .send({
                    name: 'Amazon Delivery Guy',
                    phone: '9876543210',
                    purpose: 'Delivery',
                    visitDate: new Date()
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.name).toBe('Amazon Delivery Guy');
            expect(res.body.data.status).toBe('PENDING');
            expect(res.body.data.qrCodeToken).toMatch(/^pass_/);
        });

        it('should allow tenant to get their pre-authorized passes list', async () => {
            // Create a pass first
            await PreAuthVisitor.create({
                pg_id: pgId,
                tenant_id: tenantRecord._id,
                name: 'Swiggy Agent',
                phone: '8887776665',
                purpose: 'Delivery',
                visitDate: new Date(),
                qrCodeToken: 'pass_swiggy123'
            });

            const res = await request(app)
                .get('/api/tenant/preauth-visitors')
                .set('Authorization', `Bearer ${tenantToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.length).toBe(1);
            expect(res.body.data[0].name).toBe('Swiggy Agent');
            expect(res.body.data[0].qrCodeToken).toBe('pass_swiggy123');
        });
    });

    describe('Owner/Security: Verification & Check-In Operations', () => {
        let passToken;

        beforeEach(async () => {
            const pass = await PreAuthVisitor.create({
                pg_id: pgId,
                tenant_id: tenantRecord._id,
                name: 'Swiggy Agent',
                phone: '8887776665',
                purpose: 'Delivery',
                visitDate: new Date(),
                qrCodeToken: 'pass_swiggy123'
            });
            passToken = pass.qrCodeToken;
        });

        it('should allow owner to list pre-authorized passes for the PG', async () => {
            const res = await request(app)
                .get('/api/security/preauth-visitors')
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.length).toBe(1);
            expect(res.body[0].name).toBe('Swiggy Agent');
            expect(res.body[0].tenant_id?.user_id?.name).toBe('Resident Ron');
        });

        it('should allow owner/guard to check-in a pending pre-authorized pass', async () => {
            const res = await request(app)
                .post('/api/security/preauth-visitors/check-in')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ qrCodeToken: passToken });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.preAuth.status).toBe('CHECKED_IN');
            
            // Should create a Visitor record in active log
            const activeVisitor = await Visitor.findOne({ pg_id: pgId, phone: '8887776665' });
            expect(activeVisitor).toBeDefined();
            expect(activeVisitor.status).toBe('INSIDE');
            expect(activeVisitor.details).toContain('Resident Ron');
        });

        it('should reject check-in if token is already used/checked in', async () => {
            // First check-in
            await request(app)
                .post('/api/security/preauth-visitors/check-in')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ qrCodeToken: passToken });

            // Second check-in
            const res = await request(app)
                .post('/api/security/preauth-visitors/check-in')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ qrCodeToken: passToken });

            expect(res.statusCode).toBe(404);
            expect(res.body.message).toContain('Invalid or already used');
        });
    });

    describe('Logical Multi-Tenancy Isolation', () => {
        it('should NOT allow owner of another PG to check in visitor or view visitor of this PG', async () => {
            // Create a second PG Owner
            const otherOwnerRes = await request(app).post('/api/auth/register').send({
                name: 'Other Landlord',
                email: 'other_owner@test.com',
                password: 'password123',
                role: 'owner',
                pgName: 'Other Cool PG'
            });
            const otherOwnerToken = otherOwnerRes.body.data.token;

            // Create a pre-auth visitor pass in the first PG
            const pass = await PreAuthVisitor.create({
                pg_id: pgId,
                tenant_id: tenantRecord._id,
                name: 'Swiggy Agent',
                phone: '8887776665',
                purpose: 'Delivery',
                visitDate: new Date(),
                qrCodeToken: 'pass_swiggy123'
            });

            // 1. Try to list passes using the other owner's token
            const listRes = await request(app)
                .get('/api/security/preauth-visitors')
                .set('Authorization', `Bearer ${otherOwnerToken}`);
            
            // Should return empty list or not contain the other PG's passes
            expect(listRes.statusCode).toBe(200);
            expect(listRes.body.length).toBe(0);

            // 2. Try to check in using the other owner's token
            const checkinRes = await request(app)
                .post('/api/security/preauth-visitors/check-in')
                .set('Authorization', `Bearer ${otherOwnerToken}`)
                .send({ qrCodeToken: pass.qrCodeToken });

            expect(checkinRes.statusCode).toBe(404);
            expect(checkinRes.body.message).toContain('Invalid or already used');
        });
    });
});
