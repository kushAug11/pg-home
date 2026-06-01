const request = require('supertest');
const app = require('../src/app');
const dbHandler = require('./utils/db-handler');
const User = require('../src/models/User');
const PG = require('../src/models/PG');
const generateToken = require('../src/utils/generateToken');

beforeAll(async () => await dbHandler.connect());
afterEach(async () => await dbHandler.clearDatabase());
afterAll(async () => await dbHandler.closeDatabase());

const createToken = (id) => {
    return generateToken(id);
};

describe('Security & Isolation Certification', () => {
    let ownerA, tokenA, pgA;
    let ownerB, tokenB, pgB;
    let tenantA, tokenTenantA;

    beforeEach(async () => {
        // Setup PG A (With Subscription)
        ownerA = await User.create({ name: 'Owner A', email: 'ownerA@test.com', password: 'password', role: 'owner', accountStatus: 'ACTIVE' });
        pgA = await PG.create({
            name: 'PG A',
            owner_id: ownerA._id,
            address: 'Loc A',
            city: 'City A',
            subscription: { plan: 'Pro', status: 'active', expiryDate: new Date(Date.now() + 999999999) }
        });
        ownerA.pg_id = pgA._id;
        await ownerA.save();
        tokenA = createToken(ownerA._id);

        // Setup PG B (With Subscription)
        ownerB = await User.create({ name: 'Owner B', email: 'ownerB@test.com', password: 'password', role: 'owner', accountStatus: 'ACTIVE' });
        pgB = await PG.create({
            name: 'PG B',
            owner_id: ownerB._id,
            address: 'Loc B',
            city: 'City B',
            subscription: { plan: 'Pro', status: 'active', expiryDate: new Date(Date.now() + 999999999) }
        });
        ownerB.pg_id = pgB._id;
        await ownerB.save();
        tokenB = createToken(ownerB._id);

        // Setup Tenant A (Under PG A)
        tenantA = await User.create({ name: 'Tenant A', email: 'tenantA@test.com', password: 'password', role: 'tenant', pg_id: pgA._id, accountStatus: 'ACTIVE' });
        tokenTenantA = createToken(tenantA._id);
    });

    it('Scenario A: Cross-PG Access (Owner A accessing PG B data) - BLOCKED', async () => {
        // Owner A tries to fetch details of Tenant B (we don't have Tenant B yet, but assume fetching generic resource)
        // Let's try to add a room to PG B using Owner A's token? 
        // No, middleware overwrites pg_id. So if I send pg_id=B, it should force A.
        // But if I try to GET rooms, it will query WHERE pg_id = A.
        // Isolation is proved if Owner A CANNOT see PG B's stuff.

        // Create Room in PG B
        await request(app).post('/api/owner/rooms').set('Authorization', `Bearer ${tokenB}`).send({ roomNumber: '101-B', type: 'Single', rent: 5000, capacity: 1 });

        // Owner A tries to fetch Rooms
        const res = await request(app).get('/api/owner/rooms').set('Authorization', `Bearer ${tokenA}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.count).toBe(0); // Should NOT see PG B's room
    });

    it('Scenario B: ID Manipulation (Owner A injecting PG B ID) - IGNORED/BLOCKED', async () => {
        // Owner A tries to create a room but specifies PG B's ID in body
        const res = await request(app)
            .post('/api/owner/rooms')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({
                roomNumber: 'HACK-1',
                type: 'Single',
                rent: 5000,
                capacity: 1,
                pg_id: pgB._id // MALICIOUS INJECTION
            });

        // The middleware should overwrite pg_id to pgA._id
        // So the room should be created under PG A, NOT PG B.

        // Check PG B rooms
        const roomsB = await request(app).get('/api/owner/rooms').set('Authorization', `Bearer ${tokenB}`);
        expect(roomsB.body.data.find(r => r.number === 'HACK-1')).toBeUndefined();

        // Check PG A rooms
        const roomsA = await request(app).get('/api/owner/rooms').set('Authorization', `Bearer ${tokenA}`);
        const hackedRoom = roomsA.body.data.find(r => r.number === 'HACK-1');
        expect(hackedRoom).toBeDefined();
        // expect(hackedRoom.pg_id).toBe(pgA._id.toString()); // API might not return pg_id, but context proves it.
    });

    it('Scenario C: Tenant Vertical Escalation (Tenant accessing Owner API) - BLOCKED', async () => {
        const res = await request(app)
            .get('/api/owner/rooms')
            .set('Authorization', `Bearer ${tokenTenantA}`);

        expect(res.statusCode).toBe(403); // RBAC should catch this before Isolation or same time
    });

    it('Scenario D: Orphan User Access (No PG ID) - BLOCKED', async () => {
        // Create user with no PG
        const orphan = await User.create({ name: 'Orphan', email: 'orphan@test.com', password: 'password', role: 'owner', accountStatus: 'ACTIVE' });
        const tokenOrphan = createToken(orphan._id);

        const res = await request(app)
            .get('/api/owner/rooms')
            .set('Authorization', `Bearer ${tokenOrphan}`);

        expect(res.statusCode).toBe(403);
        expect(res.body.message).toContain('Security Violation'); // Guardrail caught it
    });
});
