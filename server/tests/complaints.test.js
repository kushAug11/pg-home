const request = require('supertest');
const app = require('../src/app');
const dbHandler = require('./utils/db-handler');
const PG = require('../src/models/PG');
const emailService = require('../src/services/email.service');

jest.mock('../src/services/email.service', () => ({
    sendWelcomeEmail: jest.fn(),
    sendAccountSetupEmail: jest.fn(),
    sendOTP: jest.fn()
}));

beforeAll(async () => await dbHandler.connect());
afterEach(async () => await dbHandler.clearDatabase());
afterAll(async () => await dbHandler.closeDatabase());

// ─── Helper: full owner + active subscription setup ───────────────────────────
async function setupOwnerWithSubscription() {
    const ownerRes = await request(app).post('/api/auth/register').send({
        name: 'Test Owner',
        email: 'owner@test.com',
        password: 'password123',
        role: 'owner',
        pgName: 'Test PG'
    });
    expect(ownerRes.statusCode).toBe(201);
    const ownerToken = ownerRes.body.data.token;
    const pgId = ownerRes.body.data.pg_id;

    await PG.findByIdAndUpdate(pgId, {
        'subscription.plan': 'Pro',
        'subscription.status': 'active',
        'subscription.expiryDate': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    return { ownerToken, pgId };
}

// ─── Helper: create a room ───────────────────────────────────────────────────
async function createRoom(ownerToken) {
    const roomRes = await request(app)
        .post('/api/owner/rooms')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ roomNumber: '101', type: 'Single', rent: 5000, capacity: 1 });
    expect(roomRes.statusCode).toBe(201);
    return roomRes.body.data._id;
}

// ─── Helper: onboard a tenant and return their token ────────────────────────
async function setupTenant(ownerToken, roomId) {
    await request(app)
        .post('/api/owner/tenants')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
            name: 'Tenant Tim',
            email: 'tenant@test.com',
            password: 'ignored',
            mobile: '9876543210',
            room_id: roomId,
            rentAmount: 5000,
            deposit: 10000
        });

    const emailCall = emailService.sendAccountSetupEmail.mock.calls.find(
        (c) => c[0] === 'tenant@test.com'
    );
    if (!emailCall) throw new Error('Setup token not found in mock');
    const setupToken = emailCall[2];

    await request(app).post('/api/auth/setup-account').send({
        token: setupToken,
        password: 'TenantPass123'
    });

    const loginRes = await request(app).post('/api/auth/login').send({
        email: 'tenant@test.com',
        password: 'TenantPass123'
    });
    expect(loginRes.statusCode).toBe(200);
    return loginRes.body.data.token;
}

// ─── Tests ───────────────────────────────────────────────────────────────────
describe('Complaints API', () => {
    let ownerToken;
    let tenantToken;

    beforeEach(async () => {
        emailService.sendAccountSetupEmail.mockClear();
        const setup = await setupOwnerWithSubscription();
        ownerToken = setup.ownerToken;
        const roomId = await createRoom(ownerToken);
        tenantToken = await setupTenant(ownerToken, roomId);
    });

    // ── Tenant submits a complaint ──────────────────────────────────────────
    describe('POST /api/tenant/complaints', () => {
        it('should allow a tenant to submit a complaint', async () => {
            const res = await request(app)
                .post('/api/tenant/complaints')
                .set('Authorization', `Bearer ${tenantToken}`)
                .send({
                    title: 'Leaking pipe issue',
                    description: 'There is a water leak under the sink in my room',
                    category: 'Plumbing',
                    priority: 'High'
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.title).toBe('Leaking pipe issue');
            expect(res.body.data.status).toBe('Pending');
        });

        it('should return 401 when no auth token is provided', async () => {
            const res = await request(app)
                .post('/api/tenant/complaints')
                .send({
                    title: 'No auth complaint',
                    description: 'This should not work at all'
                });

            expect(res.statusCode).toBe(401);
        });
    });

    // ── Owner lists all complaints ──────────────────────────────────────────
    describe('GET /api/owner/complaints', () => {
        it('should return all complaints for the owner PG', async () => {
            // Tenant posts a complaint first
            await request(app)
                .post('/api/tenant/complaints')
                .set('Authorization', `Bearer ${tenantToken}`)
                .send({
                    title: 'WiFi is very slow',
                    description: 'Internet speed drops to zero after midnight',
                    category: 'WiFi',
                    priority: 'Medium'
                });

            const res = await request(app)
                .get('/api/owner/complaints')
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.count).toBeGreaterThanOrEqual(1);
            expect(res.body.data[0].title).toBe('WiFi is very slow');
        });

        it('should return 401 when no auth token is provided', async () => {
            const res = await request(app).get('/api/owner/complaints');
            expect(res.statusCode).toBe(401);
        });
    });

    // ── Owner updates complaint status ──────────────────────────────────────
    describe('PUT /api/owner/complaints/:id', () => {
        let complaintId;

        beforeEach(async () => {
            const complaintRes = await request(app)
                .post('/api/tenant/complaints')
                .set('Authorization', `Bearer ${tenantToken}`)
                .send({
                    title: 'Electrical fault',
                    description: 'Power socket in room 101 is sparking',
                    category: 'Electrical',
                    priority: 'High'
                });
            complaintId = complaintRes.body.data._id;
        });

        it('should allow owner to update complaint status to Resolved', async () => {
            const res = await request(app)
                .put(`/api/owner/complaints/${complaintId}`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ status: 'Resolved', adminComment: 'Fixed by electrician' });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.status).toBe('Resolved');
        });

        it('should allow owner to update status to In Progress', async () => {
            const res = await request(app)
                .put(`/api/owner/complaints/${complaintId}`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ status: 'In Progress' });

            expect(res.statusCode).toBe(200);
            expect(res.body.data.status).toBe('In Progress');
        });

        it('should return 404 for a non-existent complaint ID', async () => {
            const fakeId = '648f1a2b3c4d5e6f7a8b9c0d';
            const res = await request(app)
                .put(`/api/owner/complaints/${fakeId}`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ status: 'Resolved' });

            expect(res.statusCode).toBe(404);
        });
    });
});
