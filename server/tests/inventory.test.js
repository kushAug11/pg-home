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
        name: 'Inventory Owner',
        email: 'invowner@test.com',
        password: 'password123',
        role: 'owner',
        pgName: 'Inventory PG'
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
describe('Inventory API', () => {
    let ownerToken;

    beforeEach(async () => {
        const setup = await setupOwnerWithSubscription();
        ownerToken = setup.ownerToken;
    });

    // ── POST /api/inventory ────────────────────────────────────────────────────
    describe('POST /api/inventory', () => {
        it('should add a new inventory item successfully', async () => {
            const res = await request(app)
                .post('/api/inventory')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    name: 'Steel Cot',
                    category: 'Furniture',
                    total_qty: 10,
                    cost: 2500
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.name).toBe('Steel Cot');
            expect(res.body.data.total_qty).toBe(10);
            expect(res.body.data.available_qty).toBe(10);
        });

        it('should add an item with default category "Other" when category is not specified', async () => {
            const res = await request(app)
                .post('/api/inventory')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    name: 'Broom Stick',
                    total_qty: 5,
                    cost: 150
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.category).toBe('Other');
        });

        it('should return 401 when no auth token is provided', async () => {
            const res = await request(app)
                .post('/api/inventory')
                .send({
                    name: 'Unauthorized Item',
                    total_qty: 3,
                    cost: 100
                });

            expect(res.statusCode).toBe(401);
        });
    });

    // ── GET /api/inventory ────────────────────────────────────────────────────
    describe('GET /api/inventory', () => {
        it('should return an empty list when no items exist', async () => {
            const res = await request(app)
                .get('/api/inventory')
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveLength(0);
        });

        it('should return all inventory items for the PG', async () => {
            await request(app)
                .post('/api/inventory')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ name: 'Chair', category: 'Furniture', total_qty: 20, cost: 800 });

            await request(app)
                .post('/api/inventory')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ name: 'Fan', category: 'Electronics', total_qty: 10, cost: 1200 });

            const res = await request(app)
                .get('/api/inventory')
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.length).toBe(2);

            const names = res.body.data.map(i => i.name);
            expect(names).toContain('Chair');
            expect(names).toContain('Fan');
        });

        it('should return 401 when no auth token is provided', async () => {
            const res = await request(app).get('/api/inventory');
            expect(res.statusCode).toBe(401);
        });
    });

    // ── POST /api/inventory/assign (assign item to room) ──────────────────────
    describe('POST /api/inventory/assign', () => {
        let itemId;
        let roomId;

        beforeEach(async () => {
            // Add item
            const itemRes = await request(app)
                .post('/api/inventory')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ name: 'Table', category: 'Furniture', total_qty: 5, cost: 1000 });
            itemId = itemRes.body.data._id;

            // Add a room
            const roomRes = await request(app)
                .post('/api/owner/rooms')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ roomNumber: '301', type: 'Single', rent: 5000, capacity: 1 });
            roomId = roomRes.body.data._id;
        });

        it('should assign an item to a room and reduce available_qty', async () => {
            const res = await request(app)
                .post('/api/inventory/assign')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ room_id: roomId, item_id: itemId, quantity: 2 });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toMatch(/assigned/i);

            // Verify available_qty decreased
            const listRes = await request(app)
                .get('/api/inventory')
                .set('Authorization', `Bearer ${ownerToken}`);
            const updatedItem = listRes.body.data.find(i => i._id === itemId);
            expect(updatedItem.available_qty).toBe(3); // 5 - 2
        });

        it('should return 400 when insufficient stock', async () => {
            const res = await request(app)
                .post('/api/inventory/assign')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ room_id: roomId, item_id: itemId, quantity: 100 }); // more than total_qty

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('should return 401 when no auth token is provided', async () => {
            const res = await request(app)
                .post('/api/inventory/assign')
                .send({ room_id: roomId, item_id: itemId, quantity: 1 });

            expect(res.statusCode).toBe(401);
        });
    });

    // ── POST /api/inventory/return ─────────────────────────────────────────────
    describe('POST /api/inventory/return', () => {
        let itemId;
        let roomId;

        beforeEach(async () => {
            // Add item
            const itemRes = await request(app)
                .post('/api/inventory')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ name: 'Pillow', category: 'Linen', total_qty: 8, cost: 300 });
            itemId = itemRes.body.data._id;

            // Add a room
            const roomRes = await request(app)
                .post('/api/owner/rooms')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ roomNumber: '302', type: 'Double', rent: 6000, capacity: 2 });
            roomId = roomRes.body.data._id;

            // Assign item to room first
            await request(app)
                .post('/api/inventory/assign')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ room_id: roomId, item_id: itemId, quantity: 3 });
        });

        it('should return an item from a room and restore available_qty', async () => {
            const res = await request(app)
                .post('/api/inventory/return')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ room_id: roomId, item_id: itemId, quantity: 2 });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toMatch(/returned/i);

            // Verify available_qty restored
            const listRes = await request(app)
                .get('/api/inventory')
                .set('Authorization', `Bearer ${ownerToken}`);
            const updatedItem = listRes.body.data.find(i => i._id === itemId);
            // 8 - 3 + 2 = 7
            expect(updatedItem.available_qty).toBe(7);
        });

        it('should return 400 when returning more items than assigned', async () => {
            const res = await request(app)
                .post('/api/inventory/return')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ room_id: roomId, item_id: itemId, quantity: 50 }); // way more than assigned

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('should return 401 when no auth token is provided', async () => {
            const res = await request(app)
                .post('/api/inventory/return')
                .send({ room_id: roomId, item_id: itemId, quantity: 1 });

            expect(res.statusCode).toBe(401);
        });
    });
});
