const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('./src/models/User');
const PG = require('./src/models/PG');
const authController = require('./src/controllers/auth.controller');

const request = require('supertest');
const app = require('./src/app');

async function runDebug() {
    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    const uri = mongod.getUri();
    console.log("DB Connected to", uri);

    try {
        console.log("Calling POST /api/auth/register via Supertest...");
        const res = await request(app).post('/api/auth/register').send({
            name: "Debug Owner",
            email: "debug_owner_super@test.com",
            password: "password123",
            role: "owner",
            pgName: "Debug Hostel"
        });
        console.log("RESPONSE STATUS:", res.status);
        console.log("RESPONSE BODY:", JSON.stringify(res.body, null, 2));
    } catch (e) {
        console.error("CRASH:", e);
    }
    await mongoose.disconnect();
    await mongod.stop();
}

runDebug();
