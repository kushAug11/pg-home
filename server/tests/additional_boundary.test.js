
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/User');
const PG = require('../src/models/PG');
const Room = require('../src/models/Room');

describe('🛡️ Additional Boundary & Edge Case Tests', () => {
    let mongod;
    let ownerToken, pgId;

    beforeAll(async () => {
        mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();
        if (mongoose.connection.readyState !== 0) await mongoose.connection.close();
        await mongoose.connect(uri);

        // Register Owner
        const ownerRes = await request(app).post('/api/auth/register').send({
            name: "Boundary Owner",
            email: "boundary_owner@test.com",
            password: "password123",
            role: "owner",
            pgName: "Boundary Hostel"
        });
        ownerToken = ownerRes.body.data.token;
        pgId = ownerRes.body.data.pg_id;

        // Upgrade subscription
        await PG.findByIdAndUpdate(pgId, {
            'subscription.plan': 'Pro',
            'subscription.status': 'active',
            'subscription.expiryDate': new Date(Date.now() + 999999999)
        });
    });

    afterAll(async () => {
        await mongoose.connection.close();
        if (mongod) await mongod.stop();
    });

    describe('Room Management Boundary', () => {
        test('Should reject room creation with negative rent', async () => {
            const res = await request(app).post('/api/owner/rooms')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    roomNumber: "101-NEG",
                    type: "Single",
                    rent: -5000,
                    capacity: 1
                });
            expect(res.status).toBe(400);
            // If it returns 500, we have a bug.
        });

        test('Should reject room creation with zero capacity', async () => {
            const res = await request(app).post('/api/owner/rooms')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    roomNumber: "102-ZERO",
                    type: "Single",
                    rent: 5000,
                    capacity: 0
                });
            expect(res.status).toBe(400);
        });

        test('Should handle extremely long room number/name', async () => {
            const longRoom = "R".repeat(100);
            const res = await request(app).post('/api/owner/rooms')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    roomNumber: longRoom,
                    type: "Single",
                    rent: 5000,
                    capacity: 1
                });
            // Should probably fail validation if schema has maxlength, otherwise 201
            expect(res.status).not.toBe(500);
        });
    });

    describe('Tenant Management Boundary', () => {
        let roomId;
        beforeAll(async () => {
            const res = await request(app).post('/api/owner/rooms')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ roomNumber: "103-TENANT", type: "Dorm", rent: 5000, capacity: 5 });
            roomId = res.body.data._id;
        });

        test('Should reject invalid mobile number format (too short)', async () => {
            const res = await request(app).post('/api/owner/tenants')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    name: "Short Mobile",
                    email: "short@test.com",
                    mobile: "123",
                    room_id: roomId,
                    rentAmount: 5000
                });
            expect(res.status).toBe(400);
        });

        test('Should reject invalid email format', async () => {
            const res = await request(app).post('/api/owner/tenants')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    name: "Bad Email",
                    email: "bademail",
                    mobile: "9988776655",
                    room_id: roomId,
                    rentAmount: 5000
                });
            expect(res.status).toBe(400);
        });

        test('Should reject negative rent for tenant', async () => {
            const res = await request(app).post('/api/owner/tenants')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    name: "Neg Rent User",
                    email: "negrent@test.com",
                    mobile: "9988776655",
                    room_id: roomId,
                    rentAmount: -100
                });
            expect(res.status).toBe(400);
        });
    });
});
