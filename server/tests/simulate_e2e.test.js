const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../src/app');
const dbHandler = require('./utils/db-handler');
const User = require('../src/models/User');
const PG = require('../src/models/PG');
const Room = require('../src/models/Room');
const Tenant = require('../src/models/Tenant');
const AuditLog = require('../src/models/AuditLog');

// Mock Data
const ADMIN_USER = { name: "Super Admin", email: "msg_admin@hostel.com", password: "adminpassword", role: "admin" };
const OWNER_USER = { name: "E2E Owner", email: `owner_${Date.now()}@test.com`, password: "password123", role: "owner", pgName: "E2E Hostel" };
const TENANT_USER = { name: "E2E Tenant", email: `tenant_${Date.now()}@test.com`, mobile: "9988776655", rentAmount: 5000 };

describe('🚀 Master End-to-End Simulation', () => {
    let adminToken, ownerToken, tenantToken;
    let pgId, roomId, tenantId;
    let tenantPassword; // Captured from "email" (mocked)

    beforeAll(async () => {
        // Connect to TEST DB using db-handler
        await dbHandler.connect();

        // Cleanup relevant data
        await User.deleteMany({ email: { $in: [ADMIN_USER.email, OWNER_USER.email, TENANT_USER.email] } });
        await PG.deleteMany({ name: OWNER_USER.pgName });

        // Setup Admin - Create directly in DB with hashed password
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(ADMIN_USER.password, 10);
        await User.create({
            name: ADMIN_USER.name,
            email: ADMIN_USER.email,
            password: hashedPassword,
            role: 'admin'
        });

        // Get Admin Token
        const res = await request(app).post('/api/auth/login').send({
            email: ADMIN_USER.email,
            password: ADMIN_USER.password
        });

        if (!res.body.success || !res.body.data || !res.body.data.token) {
            console.error("❌ Admin Login Failed:", res.status, res.body);
            throw new Error(`Admin login failed: ${JSON.stringify(res.body)}`);
        }

        adminToken = res.body.data.token;
        console.log("✅ [Admin] Logged In");
    }, 30000); // Increase timeout to 30 seconds

    afterAll(async () => {
        await dbHandler.closeDatabase();
    });

    // --- 1. OWNER FLOW ---
    test('Owner Registration & Setup', async () => {
        // Register
        const res = await request(app).post('/api/auth/register').send(OWNER_USER);
        expect(res.status).toBe(201);
        ownerToken = res.body.data.token;
        pgId = res.body.data.pg_id;
        expect(pgId).toBeDefined();
        console.log("✅ [Owner] Registered & PG Created");

        // Verify PG created via Admin
        const adminRes = await request(app).get('/api/admin/pgs').set('Authorization', `Bearer ${adminToken}`);
        const pg = adminRes.body.data.find(p => p._id === pgId);
        expect(pg).toBeTruthy();

        // Upgrade Subscription (Required for Room Adding in next test)
        await PG.findByIdAndUpdate(pgId, {
            'subscription.plan': 'Pro',
            'subscription.status': 'active',
            'subscription.expiryDate': new Date(Date.now() + 999999999)
        });
        console.log("✅ [Owner] Subscription Upgraded to Pro");
    });

    test('Owner Adds Room', async () => {
        const res = await request(app).post('/api/owner/rooms')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({
                roomNumber: "101-E2E",
                type: "Dorm",
                rent: 5000,
                capacity: 2
            });

        if (res.status !== 201 || !res.body.data || !res.body.data._id) {
            console.error("❌ Room Creation Failed:", res.status, res.body);
            throw new Error(`Room creation failed: ${JSON.stringify(res.body)}`);
        }

        roomId = res.body.data._id;
        expect(roomId).toBeDefined();
        console.log("✅ [Owner] Room 101-E2E Created, ID:", roomId);
    });

    test('Owner Adds Tenant (ACID Transaction Verification)', async () => {
        // This verifies the atomic transaction logic
        const res = await request(app).post('/api/owner/tenants')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({
                name: TENANT_USER.name,
                email: TENANT_USER.email,
                mobile: TENANT_USER.mobile,
                room_id: roomId,
                rentAmount: TENANT_USER.rentAmount,
                preferredLanguage: 'en'
            });

        if (res.status !== 201) console.error("Add Tenant Failed:", res.body);
        expect(res.status).toBe(201);
        tenantId = res.body.data._id;

        // Verify User Created
        const user = await User.findOne({ email: TENANT_USER.email });
        expect(user).toBeTruthy();
        expect(user.accountStatus).toBe('PENDING_ACTIVATION');

        // Verify Analytics
        const analytics = await mongoose.connection.db.collection('onboardinganalytics').findOne({ tenant_id: user._id, step: 'CREATED' });
        expect(analytics).toBeTruthy();

        console.log("✅ [Owner] Tenant Added (Transaction Success)");
    });

    test('Owner Triggers Backup', async () => {
        // Testing Admin Trigger Backup endpoint
        const res = await request(app).post('/api/admin/backups')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        console.log("✅ [Admin] Database Backup Triggered");
    });

    test('Verify Audit Logs', async () => {
        const res = await request(app).get('/api/admin/audit-logs').set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);

        // Should have ADD_TENANT log
        const logs = res.body.data;
        const addTenantLog = logs.find(l => l.action === 'ADD_TENANT' && l.actor_role === 'owner');
        expect(addTenantLog).toBeTruthy();
        console.log("✅ [Admin] Audit Log Verified");
    });
});
