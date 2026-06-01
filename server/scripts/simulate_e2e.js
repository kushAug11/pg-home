process.env.NODE_ENV = 'test';
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const PG = require('../src/models/PG');
const AuditLog = require('../src/models/AuditLog');
const { connectDB } = require('../src/config/db');

// Mock Data for Simulation
const ADMIN_USER = { name: "Super Admin", email: "msg_admin@hostel.com", password: "adminpassword", role: "admin" };
const OWNER_USER = { name: "E2E Owner", email: `owner_${Date.now()}@test.com`, password: "password123", role: "owner", pgName: "E2E Hostel" };
const TENANT_USER = { name: "E2E Tenant", email: `tenant_${Date.now()}@test.com`, mobile: "9988776655", rentAmount: 5000 };

const fs = require('fs');

// Helper to log to console and file simultaneously
const log = (msg) => {
    console.log(msg);
    fs.appendFileSync('sim_log.txt', msg + '\n');
};

const { MONGODB_URI } = require('../src/config/env');

/**
 * Run End-to-End Simulation
 * Simulates a full lifecycle:
 * 1. Admin Login
 * 2. Owner Registration & PG Creation
 * 3. Room Management
 * 4. Tenant Onboarding (Transactional)
 * 5. Backup Triggering
 * 6. Audit Log Verification
 */
const runSimulation = async () => {
    try {
        log("🔵 Connecting to DB...");
        // Use Cloud URI but switch DB to 'hostel_saas_test' to avoid polluting prod
        const testURI = MONGODB_URI.replace('hostel_saas_db', 'hostel_saas_test');

        await mongoose.connect(testURI, {
            serverSelectionTimeoutMS: 5000 // 5 seconds timeout to prevent hanging
        });
        log("✅ DB Connected");

        // 1. CLEANUP
        // Remove previous test data to ensure a clean state
        log("🧹 Cleaning up...");
        await User.deleteMany({ email: { $in: [ADMIN_USER.email, OWNER_USER.email, TENANT_USER.email] } });
        await PG.deleteMany({ name: OWNER_USER.pgName });

        // 2. SETUP ADMIN
        console.log("👤 Setting up Admin...");
        // Register (ignore error if exists)
        await request(app).post('/api/auth/register').send(ADMIN_USER);
        // Force Role to 'admin' directly in DB as register route prevents it
        await User.findOneAndUpdate({ email: ADMIN_USER.email }, { role: 'admin' }, { upsert: true });

        // Login Admin to get Token
        let res = await request(app).post('/api/auth/login').send({ email: ADMIN_USER.email, password: ADMIN_USER.password });
        if (!res.body.success) throw new Error(`Admin Login Failed: ${res.status} ${JSON.stringify(res.body)}`);
        const adminToken = res.body.data.token;
        console.log("✅ Admin Logged In");

        // 3. OWNER REGISTRATION
        console.log("🏠 Registering Owner...");
        res = await request(app).post('/api/auth/register').send(OWNER_USER);
        if (res.status !== 201) throw new Error(`Owner Register Failed: ${JSON.stringify(res.body)}`);
        const ownerToken = res.body.data.token;
        console.log("✅ Owner Registered & PG Created");

        // 4. ADD ROOM
        console.log("🛏️ Adding Room...");
        res = await request(app).post('/api/owner/rooms')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({
                roomNumber: "101-E2E",
                type: "Sharing",
                rent: 5000,
                capacity: 2
            });
        if (res.status !== 201) throw new Error(`Add Room Failed: ${JSON.stringify(res.body)}`);
        const roomId = res.body.data._id;
        console.log("✅ Room Added");

        // 5. ADD TENANT (TRANSACTIONAL)
        // This tests the atomic transaction logic in the controller
        console.log("👥 Adding Tenant (Transactional)...");
        res = await request(app).post('/api/owner/tenants')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({
                name: TENANT_USER.name,
                email: TENANT_USER.email,
                mobile: TENANT_USER.mobile,
                room_id: roomId,
                rentAmount: TENANT_USER.rentAmount,
                preferredLanguage: 'en'
            });

        if (res.status !== 201) throw new Error(`Add Tenant Failed: ${JSON.stringify(res.body)}`);
        console.log("✅ Tenant Added Successfully");

        // 6. TRIGGER BACKUP (ADMIN)
        // Tests the background backup service
        console.log("💾 Triggering Backup...");
        res = await request(app).post('/api/admin/backups')
            .set('Authorization', `Bearer ${adminToken}`);
        if (res.status !== 200) throw new Error(`Backup Failed: ${JSON.stringify(res.body)}`);
        console.log("✅ Backup Triggered");

        // 7. VERIFY AUDIT LOGS
        // Ensures important actions are being logged
        console.log("🔍 Verifying Audit Logs...");
        res = await request(app).get('/api/admin/audit-logs').set('Authorization', `Bearer ${adminToken}`);
        const logs = res.body.data;
        const tenantLog = logs.find(l => l.action === 'ADD_TENANT' && l.actor_role === 'owner');

        if (!tenantLog) throw new Error("Audit Log for ADD_TENANT not found!");
        console.log("✅ Audit Log Verified");

        console.log("\n🚀 SIMULATION COMPLETE: ALL SYSTEMS GO");
        process.exit(0);

    } catch (error) {
        console.error("\n❌ SIMULATION FAILED:", error.message);
        if (error.response) console.error("Response:", error.response.data);
        process.exit(1);
    }
};

runSimulation();
