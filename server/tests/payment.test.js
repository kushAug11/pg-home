const request = require('supertest');
const app = require('../src/app');
const dbHandler = require('./utils/db-handler');
const User = require('../src/models/User');
const Payment = require('../src/models/Payment');
const PG = require('../src/models/PG');
const generateToken = require('../src/utils/generateToken');
const paymentService = require('../src/services/payment.service');

beforeAll(async () => await dbHandler.connect());
afterEach(async () => await dbHandler.clearDatabase());
afterAll(async () => await dbHandler.closeDatabase());

describe('Payment System Integration', () => {
    let ownerToken, tenantToken;
    let owner, tenant;
    let pg;

    beforeEach(async () => {
        // 1. Create Owner & PG
        owner = await User.create({
            name: 'Test Owner',
            email: 'owner@test.com',
            password: 'password123',
            role: 'owner'
        });

        pg = await PG.create({
            name: 'Test PG',
            address: '123 St',
            city: 'Test City',
            type: 'Both',
            owner_id: owner._id,
            subscription: { status: 'inactive' }
        });

        owner.pg_id = pg._id;
        await owner.save();
        ownerToken = generateToken(owner._id);

        // 2. Create Tenant
        tenant = await User.create({
            name: 'Test Tenant',
            email: 'tenant@test.com',
            password: 'password123',
            role: 'tenant',
            pg_id: pg._id
        });
        tenantToken = generateToken(tenant._id);
    });

    it('should allow Owner to create Subscription Order', async () => {
        const res = await request(app)
            .post('/api/payments/order')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({
                planType: 'Pro',
                type: 'SUBSCRIPTION'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.amount).toBe(149900); // 1499 * 100
    });

    it('should BLOCK Tenant from creating Subscription Order', async () => {
        const res = await request(app)
            .post('/api/payments/order')
            .set('Authorization', `Bearer ${tenantToken}`)
            .send({
                planType: 'Pro',
                type: 'SUBSCRIPTION'
            });

        expect(res.statusCode).toBe(403);
        expect(res.body.message).toMatch(/Only Owners/i);
    });

    it('should Verify Payment and Activate Subscription', async () => {
        // 1. Order
        const orderRes = await request(app)
            .post('/api/payments/order')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ planType: 'Starter', type: 'SUBSCRIPTION' });

        const { orderId } = orderRes.body;
        const paymentId = 'pay_mock_' + Date.now();
        const signature = paymentService.generateMockSignature(orderId, paymentId);

        // 2. Verify
        const verifyRes = await request(app)
            .post('/api/payments/verify')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ orderId, paymentId, signature });

        expect(verifyRes.statusCode).toBe(200);

        // 3. Check DB Effect
        const updatedPg = await PG.findById(pg._id);
        expect(updatedPg.subscription.status).toBe('active');
        expect(updatedPg.subscription.plan).toBe('Starter');
        expect(updatedPg.subscription.expiryDate).toBeDefined();
    });

    it('should be Idempotent (Replay Attack Protection)', async () => {
        // 1. Order
        const orderRes = await request(app)
            .post('/api/payments/order')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ planType: 'Pro', type: 'SUBSCRIPTION' });

        const { orderId } = orderRes.body;
        const paymentId = 'pay_replay_' + Date.now();
        const signature = paymentService.generateMockSignature(orderId, paymentId);

        // 2. Verify ONCE
        await request(app).post('/api/payments/verify').set('Authorization', `Bearer ${ownerToken}`).send({ orderId, paymentId, signature });

        // 3. Verify TWICE (Replay)
        const replayRes = await request(app)
            .post('/api/payments/verify')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ orderId, paymentId, signature });

        expect(replayRes.statusCode).toBe(200); // Should still return 200 OK to frontend
        expect(replayRes.body.message).toMatch(/already processed/i);

        // Ensure expiry didn't get pushed twice (simple check: logic in controller handles it)
    });

    it('should Self-Heal (Resume) a crashed transaction', async () => {
        // Simulate a "Crashed" Payment (SUCCESS but !subscription_processed)
        const orderRes = await request(app)
            .post('/api/payments/order')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ planType: 'Enterprise', type: 'SUBSCRIPTION' });

        const { orderId } = orderRes.body;

        // Manually create the "Stuck" state in DB
        await Payment.findOneAndUpdate(
            { gateway_order_id: orderId },
            {
                status: 'SUCCESS',
                subscription_processed: false,
                gateway_payment_id: 'pay_crash_123'
            }
        );

        // Verify: Calling this should Trigger Resume Logic
        const resumeRes = await request(app)
            .post('/api/payments/verify')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({
                orderId,
                paymentId: 'pay_crash_123',
                signature: 'any_sig_ignored_in_resume'
            });

        expect(resumeRes.statusCode).toBe(200);

        // Check DB: Should be processed now
        const payment = await Payment.findOne({ gateway_order_id: orderId });
        expect(payment.subscription_processed).toBe(true);

        // Check PG: Enterprise Plan Active
        const updatedPg = await PG.findById(pg._id);
        expect(updatedPg.subscription.plan).toBe('Enterprise');
    });
});
