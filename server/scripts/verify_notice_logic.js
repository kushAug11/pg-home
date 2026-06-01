process.env.NODE_ENV = 'test';
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const PG = require('../src/models/PG');
const Tenant = require('../src/models/Tenant');
const Room = require('../src/models/Room');
const { MONGODB_URI } = require('../src/config/env');
const bcrypt = require('bcryptjs');

const OWNER_USER = { name: "Notice Test Owner", email: `notice_owner_${Date.now()}@test.com`, password: "password123", role: "owner", pgName: "Notice PG" };
const TENANT_USER = { name: "Notice Tenant", email: `notice_tenant_${Date.now()}@test.com`, mobile: "9988776655", rentAmount: 6000 };

const runVerification = async () => {
    try {
        console.log("🔵 Connecting to DB...");
        const testURI = MONGODB_URI.replace('hostel_saas_db', 'hostel_saas_test');
        await mongoose.connect(testURI);
        console.log("✅ DB Connected");

        // CLEANUP
        await User.deleteMany({ email: { $in: [OWNER_USER.email, TENANT_USER.email] } });
        await PG.deleteMany({ name: OWNER_USER.pgName });

        // 1. REGISTER OWNER
        console.log("🏠 Registering Owner...");
        let res = await request(app).post('/api/auth/register').send(OWNER_USER);
        if (res.status !== 201) throw new Error(`Owner Register Failed: ${JSON.stringify(res.body)}`);
        const ownerToken = res.body.data.token;
        const pgId = res.body.data.pg_id;
        console.log("✅ Owner Registered");

        // 1.5 ACTIVATE SUBSCRIPTION
        console.log("💎 Activating Subscription...");
        await PG.findByIdAndUpdate(pgId, {
            subscription: {
                status: 'active',
                plan: 'Pro',
                startDate: new Date(),
                expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
        });


        // 2. ADD ROOM
        console.log("🛏️ Adding Room...");
        res = await request(app).post('/api/owner/rooms')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ roomNumber: "202-Exit", type: "Single", rent: 6000, capacity: 1 });

        if (res.status !== 201) throw new Error(`Add Room Failed: ${JSON.stringify(res.body)}`);
        const roomId = res.body.data._id;


        // 3. ADD TENANT
        console.log("👥 Adding Tenant...");
        res = await request(app).post('/api/owner/tenants')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({
                name: TENANT_USER.name,
                email: TENANT_USER.email,
                mobile: TENANT_USER.mobile,
                room_id: roomId,
                rentAmount: TENANT_USER.rentAmount
            });
        const tenantId = res.body.data._id;
        console.log("✅ Tenant Added");

        // 4. PREPARE TENANT LOGIN (Reset Password manually)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("tenantpass123", salt);
        await User.findOneAndUpdate({ email: TENANT_USER.email }, { password: hashedPassword, accountStatus: 'ACTIVE' });

        // Login Tenant
        console.log("🔑 Logging in Tenant...");
        res = await request(app).post('/api/auth/login').send({ email: TENANT_USER.email, password: "tenantpass123" });
        if (!res.body.success) throw new Error("Tenant Login Failed");
        const tenantToken = res.body.data.token;
        console.log("✅ Tenant Logged In");

        // 5. TENANT REQUESTS EXIT
        console.log("🚪 Tenant Requesting Exit...");
        const exitData = {
            reason: "Moving to another city",
            date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days later
        };
        res = await request(app).post('/api/tenant/request-exit')
            .set('Authorization', `Bearer ${tenantToken}`)
            .send(exitData);

        if (!res.body.success) throw new Error(`Exit Request Failed: ${JSON.stringify(res.body)}`);
        console.log("✅ Exit Request Submitted");

        // 6. OWNER APPROVES EXIT
        console.log("👍 Owner Approving Exit...");
        res = await request(app).post('/api/owner/tenants/exit-request')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({
                tenantId: tenantId,
                status: 'APPROVED',
                comment: 'Approved, please clear dues.',
                exitDate: exitData.date
            });

        if (!res.body.success) throw new Error(`Owner Approval Failed: ${JSON.stringify(res.body)}`);
        if (res.body.data.status !== 'on_notice') throw new Error("Tenant status not updated to 'on_notice'");
        console.log("✅ Exit Approved & Status Verified");

        console.log("\n✨ NOTICE PERIOD LOGIC VERIFIED SUCCESSFULLY ✨");
        process.exit(0);

    } catch (error) {
        console.error("\n❌ VERIFICATION FAILED:", error.message);
        if (error.response) console.log(error.response.body);
        process.exit(1);
    }
};

runVerification();
