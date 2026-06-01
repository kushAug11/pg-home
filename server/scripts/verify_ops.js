process.env.NODE_ENV = 'test';
const request = require('supertest');
const app = require('../src/app');
const mongoose = require('mongoose');
const { MONGODB_URI } = require('../src/config/env');
const User = require('../src/models/User');

const runVerification = async () => {
    try {
        // 1. Connect DB for Health Check
        const testURI = MONGODB_URI.replace('hostel_saas_db', 'hostel_saas_test');
        await mongoose.connect(testURI);

        // 2. CHECK HEALTH ENDPOINT
        console.log("🏥 Checking /health...");
        const healthRes = await request(app).get('/health');
        if (healthRes.status !== 200 || !healthRes.body.success) {
            throw new Error(`Health Check Failed: ${JSON.stringify(healthRes.body)}`);
        }
        console.log("✅ Health Check Passed:", healthRes.body.services);

        // 3. CHECK SUPPORT TOOL (Admin)
        console.log("🛠️ Checking Admin Support Tool...");
        const adminEmail = `admin_ops_${Date.now()}@test.com`;

        // Register correctly to hash password
        const regRes = await request(app).post('/api/auth/register').send({
            name: 'Ops Admin',
            email: adminEmail,
            password: 'password',
            role: 'owner'
        });

        // Force Admin Role
        await User.findOneAndUpdate({ email: adminEmail }, { role: 'admin' });

        // Login
        const loginRes = await request(app).post('/api/auth/login').send({ email: adminEmail, password: 'password' });

        if (!loginRes.body.success) {
            throw new Error(`Login Failed: ${JSON.stringify(loginRes.body)}`);
        }
        const token = loginRes.body.data.token;

        // Call Support Endpoint
        const supportRes = await request(app).get('/api/admin/support/user')
            .query({ email: adminEmail })
            .set('Authorization', `Bearer ${token}`);

        if (!supportRes.body.success || supportRes.body.user.email !== adminEmail) {
            throw new Error(`Support Tool Failed: ${JSON.stringify(supportRes.body)}`);
        }
        console.log("✅ Support Tool Verified");

        console.log("\n🚀 OPERATIONAL READINESS VERIFIED");
        process.exit(0);
    } catch (error) {
        console.error("\n❌ VERIFICATION FAILED:", error.message);
        if (error.response) console.log(error.response.body);
        process.exit(1);
    }
};

runVerification();
