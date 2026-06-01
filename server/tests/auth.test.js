const request = require('supertest');
const app = require('../src/app');
const dbHandler = require('./utils/db-handler');
const User = require('../src/models/User');

// Connect to a new in-memory database before running any tests.
beforeAll(async () => await dbHandler.connect());

// Clear all test data after every test.
afterEach(async () => await dbHandler.clearDatabase());

// Remove and close the db and server.
afterAll(async () => await dbHandler.closeDatabase());

describe('Auth Endpoints', () => {

    it('should register a new tenant successfully', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Test Tenant',
                email: 'tenant@test.com',
                password: 'password123',
                role: 'tenant'
            });

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('data');
        expect(res.body.data).toHaveProperty('token');
        expect(res.body.data.email).toEqual('tenant@test.com');
    });

    it('should prevent registration of "admin" role via public API', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Fake Admin',
                email: 'fakeadmin@test.com',
                password: 'password123',
                role: 'admin'
            });

        expect(res.statusCode).toEqual(400);
        expect(res.body.success).toBe(false);
    });

    it('should login an existing user', async () => {
        // 1. Register
        await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Login User',
                email: 'login@test.com',
                password: 'password123',
                role: 'tenant'
            });

        // 2. Login
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'login@test.com',
                password: 'password123'
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body.data).toHaveProperty('token');
    });

    it('should fail login with incorrect password', async () => {
        await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Fail User',
                email: 'fail@test.com',
                password: 'password123',
                role: 'tenant'
            });

        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'fail@test.com',
                password: 'wrongpassword'
            });

        expect(res.statusCode).toEqual(401);
    });

});
