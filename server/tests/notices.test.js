const request = require('supertest');
const app = require('../src/app');
const dbHandler = require('./utils/db-handler');
const PG = require('../src/models/PG');

jest.mock('../src/services/email.service', () => ({
    sendWelcomeEmail: jest.fn(),
    sendAccountSetupEmail: jest.fn(),
    sendOTP: jest.fn()
}));

beforeAll(async () => await dbHandler.connect());
afterEach(async () => await dbHandler.clearDatabase());
afterAll(async () => await dbHandler.closeDatabase());

// ─── Helper: owner with active subscription ───────────────────────────────────
async function setupOwnerWithSubscription() {
    const ownerRes = await request(app).post('/api/auth/register').send({
        name: 'Notice Owner',
        email: 'noticeowner@test.com',
        password: 'password123',
        role: 'owner',
        pgName: 'Notice PG'
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

// ─── Tests ───────────────────────────────────────────────────────────────────
describe('Notices API', () => {
    let ownerToken;

    beforeEach(async () => {
        const setup = await setupOwnerWithSubscription();
        ownerToken = setup.ownerToken;
    });

    // ── Create Notice ─────────────────────────────────────────────────────────
    describe('POST /api/owner/notices', () => {
        it('should create a notice successfully with valid fields', async () => {
            const res = await request(app)
                .post('/api/owner/notices')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    title: 'Water Tank Cleaning',
                    message: 'Water supply will be disrupted on Sunday from 9am to 1pm',
                    type: 'Urgent'
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.title).toBe('Water Tank Cleaning');
        });

        it('should create a notice without the optional type field', async () => {
            const res = await request(app)
                .post('/api/owner/notices')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    title: 'General Announcement',
                    message: 'Please maintain cleanliness in common areas'
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
        });

        it('should return 401 when no auth token is provided', async () => {
            const res = await request(app)
                .post('/api/owner/notices')
                .send({
                    title: 'Unauthorized Notice',
                    message: 'This should not be created'
                });

            expect(res.statusCode).toBe(401);
        });

        it('should return 400 when title is missing', async () => {
            const res = await request(app)
                .post('/api/owner/notices')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    message: 'A notice without a title'
                });

            expect(res.statusCode).toBe(400);
        });

        it('should return 400 when message is missing', async () => {
            const res = await request(app)
                .post('/api/owner/notices')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    title: 'A notice without a message'
                });

            expect(res.statusCode).toBe(400);
        });
    });

    // ── List Notices ──────────────────────────────────────────────────────────
    describe('GET /api/owner/notices', () => {
        it('should return an empty list when no notices exist', async () => {
            const res = await request(app)
                .get('/api/owner/notices')
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveLength(0);
        });

        it('should return all notices for the owner PG', async () => {
            // Create two notices first
            await request(app)
                .post('/api/owner/notices')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ title: 'Notice One', message: 'First notice message here' });

            await request(app)
                .post('/api/owner/notices')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ title: 'Notice Two', message: 'Second notice message here' });

            const res = await request(app)
                .get('/api/owner/notices')
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.count).toBe(2);
            expect(res.body.data.length).toBe(2);
        });

        it('should return 401 when no auth token is provided', async () => {
            const res = await request(app).get('/api/owner/notices');
            expect(res.statusCode).toBe(401);
        });
    });

    // ── Delete Notice ─────────────────────────────────────────────────────────
    describe('DELETE /api/owner/notices/:id', () => {
        it('should delete a notice successfully', async () => {
            const createRes = await request(app)
                .post('/api/owner/notices')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    title: 'Delete Me Notice',
                    message: 'This notice will be deleted in the test'
                });
            const noticeId = createRes.body.data._id;

            const deleteRes = await request(app)
                .delete(`/api/owner/notices/${noticeId}`)
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(deleteRes.statusCode).toBe(200);
            expect(deleteRes.body.success).toBe(true);

            // Verify deletion
            const listRes = await request(app)
                .get('/api/owner/notices')
                .set('Authorization', `Bearer ${ownerToken}`);
            expect(listRes.body.data).toHaveLength(0);
        });

        it('should return 404 when deleting a non-existent notice', async () => {
            const fakeId = '648f1a2b3c4d5e6f7a8b9c0d';
            const res = await request(app)
                .delete(`/api/owner/notices/${fakeId}`)
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.statusCode).toBe(404);
        });

        it('should return 401 when no auth token is provided', async () => {
            const fakeId = '648f1a2b3c4d5e6f7a8b9c0d';
            const res = await request(app).delete(`/api/owner/notices/${fakeId}`);
            expect(res.statusCode).toBe(401);
        });
    });
});
