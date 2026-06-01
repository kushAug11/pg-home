const request = require('supertest');
const app = require('../src/app');
const dbHandler = require('./utils/db-handler');
const User = require('../src/models/User');
const Tenant = require('../src/models/Tenant');

// Setup DB
beforeAll(async () => await dbHandler.connect());
afterEach(async () => await dbHandler.clearDatabase());
afterAll(async () => await dbHandler.closeDatabase());

describe('🚪 Exit Workflow Automation', () => {
    let ownerToken, tenantToken;
    let pgId, roomId, tenantId;

    // Setup: Create Owner, Room, and Tenant
    beforeEach(async () => {
        // 1. Owner
        const ownerRes = await request(app).post('/api/auth/register').send({
            name: 'Exit Owner', email: 'exit_owner@test.com', password: 'password', role: 'owner', pgName: 'Exit PG'
        });
        if (ownerRes.status !== 201) console.error("Owner Register Failed:", ownerRes.body);
        ownerToken = ownerRes.body.data.token;
        pgId = ownerRes.body.data.pg_id;

        // 1.5 UPGRADE SUBSCRIPTION (Required for adding rooms)
        const PG = require('../src/models/PG');
        await PG.findByIdAndUpdate(pgId, {
            'subscription.plan': 'Pro',
            'subscription.status': 'active',
            'subscription.expiryDate': new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        });

        // 2. Room
        const roomRes = await request(app).post('/api/owner/rooms')

            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ roomNumber: '101', type: 'Single', rent: 5000, capacity: 1 });
        if (roomRes.status !== 201) console.error("Room Create Failed:", roomRes.body);
        roomId = roomRes.body.data._id;

        // 3. Tenant
        const tenantRes = await request(app).post('/api/owner/tenants')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({
                name: 'Exit Tenant', email: 'exit_tenant@test.com', mobile: '9988776655',
                room_id: roomId, rentAmount: 5000, deposit: 10000
            });

        if (tenantRes.status !== 201) console.error("Tenant Create Failed:", tenantRes.body);
        tenantId = tenantRes.body.data._id;

        // 4. Update Password (Log check)
        const user = await User.findOne({ email: 'exit_tenant@test.com' });
        if (!user) console.error("❌ Tenant User NOT found in DB after creation!");
    });


    test('Full Exit Lifecycle: Request -> Approve -> On Notice', async () => {
        // 1. Prepare Tenant Token
        // Create a real new user or update existing?
        // Let's just update the existing user with a known password for simplicity
        // Actually, just using `request(app)` to login requires the password to match DB hash.
        // Let's use a setup helper.
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('password', 8);
        await User.findOneAndUpdate({ email: 'exit_tenant@test.com' }, { password: hashedPassword, accountStatus: 'ACTIVE' });

        const loginRes = await request(app).post('/api/auth/login').send({ email: 'exit_tenant@test.com', password: 'password' });
        tenantToken = loginRes.body.data.token;

        // 2. Tenant Requests Exit
        const exitDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        const reqRes = await request(app).post('/api/tenant/request-exit')
            .set('Authorization', `Bearer ${tenantToken}`)
            .send({ reason: 'Found better job', date: exitDate });

        expect(reqRes.status).toBe(200);
        expect(reqRes.body.data.exit_request.status).toBe('PENDING');

        // 3. Owner Approves Exit
        const approveRes = await request(app).post('/api/owner/tenants/exit-request')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({
                tenantId: tenantId,
                status: 'APPROVED',
                comment: 'Good luck!',
                exitDate: exitDate
            });

        expect(approveRes.status).toBe(200);
        expect(approveRes.body.data.status).toBe('on_notice');
        expect(approveRes.body.data.exit_date).toBe(exitDate);

        // 4. Verify Tenant UI sees status
        const dashboardRes = await request(app).get('/api/tenant/dashboard')
            .set('Authorization', `Bearer ${tenantToken}`);

        expect(dashboardRes.body.data.tenant.status).toBe('on_notice');
        expect(dashboardRes.body.data.tenant.exit_date).toBe(exitDate);
    });

    test('Owner Rejects Exit Request', async () => {
        // Setup Tenant Token
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('password', 8);
        await User.findOneAndUpdate({ email: 'exit_tenant@test.com' }, { password: hashedPassword, accountStatus: 'ACTIVE' });
        const loginRes = await request(app).post('/api/auth/login').send({ email: 'exit_tenant@test.com', password: 'password' });
        tenantToken = loginRes.body.data.token;

        // Request
        await request(app).post('/api/tenant/request-exit')
            .set('Authorization', `Bearer ${tenantToken}`)
            .send({ reason: 'Test', date: new Date().toISOString() });

        // Reject
        const rejectRes = await request(app).post('/api/owner/tenants/exit-request')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({
                tenantId: tenantId,
                status: 'REJECTED',
                comment: 'Stay longer please'
            });

        expect(rejectRes.status).toBe(200);
        expect(rejectRes.body.data.exit_request.status).toBe('REJECTED');
        expect(rejectRes.body.data.status).toBe('active'); // Should remain active
    });
});
