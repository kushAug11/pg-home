const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const app = require('../src/app');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');
const PG = require('../src/models/PG');
const Room = require('../src/models/Room');
const Tenant = require('../src/models/Tenant');

// MOCK DATA
const OWNER = { name: "Edge Owner", email: "edge_owner@test.com", password: "password123", role: "owner", pgName: "Edge Hostel" };
const TENANT_1 = { name: "Racer 1", email: "race1@test.com", mobile: "9911111111" };
const TENANT_2 = { name: "Racer 2", email: "race2@test.com", mobile: "9922222222" };

describe('⚠️ Edge Case & Resilience Tests', () => {
    let mongod;
    let ownerToken, pgId, roomId;

    beforeAll(async () => {
        try {
            console.log("🔵 SETUP: Starting In-Memory DB (Replica Set)...");
            mongod = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
            const uri = mongod.getUri();

            if (mongoose.connection.readyState !== 0) await mongoose.connection.close();
            await mongoose.connect(uri);
            console.log("✅ SETUP: DB Connected");

            // Register Owner
            console.log("🔵 SETUP: Registering Owner...");
            const res = await request(app).post('/api/auth/register').send(OWNER);
            if (res.status !== 201) {
                console.error("❌ SETUP FAILED: Register Owner Status:", res.status);
                console.error("❌ SETUP FAILED: Register Body:", JSON.stringify(res.body));
                throw new Error("Failed to register owner");
            }
            ownerToken = res.body.data.token;
            pgId = res.body.data.pg_id;
            console.log("✅ SETUP: Owner Registered");

            // Upgrade Subscription (Required for Room Adding)
            await PG.findByIdAndUpdate(pgId, {
                'subscription.plan': 'Pro',
                'subscription.status': 'active',
                'subscription.expiryDate': new Date(Date.now() + 999999999)
            });

            // Create 1 Room with Capacity 1
            const roomRes = await request(app).post('/api/owner/rooms')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ roomNumber: "101-RACE", type: "Single", rent: 5000, capacity: 1 });

            if (roomRes.status !== 201 || !roomRes.body.data) {
                console.error("❌ Room Creation Failed:", roomRes.status, roomRes.body);
                throw new Error(`Room creation failed: ${JSON.stringify(roomRes.body)}`);
            }
            roomId = roomRes.body.data._id;
            console.log("✅ SETUP: Room Created");

        } catch (e) {
            console.error("❌ BEFORE_ALL CRITICAL FAILURE:");
            console.error(e.message);
            console.error(e.stack);
            throw e;
        }
    });

    afterAll(async () => {
        await mongoose.connection.close();
        if (mongod) await mongod.stop();
        jest.restoreAllMocks();
    });

    // Skip Race Condition for now to see if Setup passes
    test('1. Role Integrity: Prevent Dual Roles', async () => {
        const res = await request(app).post('/api/auth/register').send({
            name: "Imposter",
            email: OWNER.email,
            password: "newpassword",
            role: "tenant"
        });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test('2. Cascade Delete: Delete PG cleans up Rooms', async () => {
        // Mock Admin Token
        const hashedPassword = await bcrypt.hash("password", 10);
        await User.create({ name: "Admin", email: "admin_edge@test.com", password: hashedPassword, role: "admin" });
        const adminLogin = await request(app).post('/api/auth/login').send({ email: "admin_edge@test.com", password: "password" });
        const adminToken = adminLogin.body.data.token;

        const delRes = await request(app).delete(`/api/admin/pgs/${pgId}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(delRes.status).toBe(200);

        // Verify Room Deleted
        const room = await Room.findById(roomId);
        expect(room).toBeNull();
    });
});
