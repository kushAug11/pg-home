process.env.RAZORPAY_KEY_ID = 'mock_key_id';
process.env.RAZORPAY_KEY_SECRET = 'mock_key_secret';
process.env.RAZORPAY_WEBHOOK_SECRET = 'mock_webhook_secret';

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Payment = require('../src/models/Payment');
const PG = require('../src/models/PG');
const Room = require('../src/models/Room');
const Tenant = require('../src/models/Tenant');
const paymentService = require('../src/services/payment.service');
const crypto = require('crypto');
const dbHandler = require('./utils/db-handler');

// MOCK DATA
const TENANT_USER = { name: "Pay Mock Tenant", email: `paymock_${Date.now()}@test.com`, password: "password123", role: "tenant" };

describe('💳 Payment Mock Tests', () => {
    let token, tenantId;

    beforeAll(async () => {
        try {
            await dbHandler.connect();

            await User.deleteMany({});

            const res = await request(app).post('/api/auth/register').send(TENANT_USER);
            const tenantUserId = res.body.data.user ? res.body.data.user._id : res.body.data._id;
            token = res.body.data.token;

            const pg = await PG.create({
                name: 'Payment Mock PG',
                address: '123 Mock Street',
                city: 'Mock City',
                type: 'Both',
                owner_id: tenantUserId
            });

            const room = await Room.create({
                pg_id: pg._id,
                number: '102',
                type: 'Single',
                capacity: 1,
                price: 5000
            });

            const tenant = await Tenant.create({
                user_id: tenantUserId,
                pg_id: pg._id,
                room_id: room._id,
                rentAmount: 5000,
                contact_number: '9876543210'
            });

            await User.findByIdAndUpdate(tenantUserId, { pg_id: pg._id });

            tenantId = tenant._id.toString();
        } catch (e) {
            console.error(e);
            throw e;
        }
    });

    afterAll(async () => {
        await dbHandler.closeDatabase();
    });

    let orderId;

    test('1. Create Order (Mock Mode)', async () => {
        const res = await request(app).post('/api/payments/order')
            .set('Authorization', `Bearer ${token}`)
            .send({
                type: 'RENT',
                planType: null,
                tenantId: tenantId,
                amount: 5000
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.keyId).toBe('mock_key_id'); // Confirm Mock
        orderId = res.body.orderId;
    });

    test('2. Verify Payment', async () => {
        const signature = 'mock_signature';
        const res = await request(app).post('/api/payments/verify')
            .set('Authorization', `Bearer ${token}`)
            .send({
                orderId: orderId,
                paymentId: 'pay_mock_123',
                signature: signature
            });

        if (res.status !== 200) console.error(res.body);
        expect(res.status).toBe(200);

        const payment = await Payment.findOne({ gateway_order_id: orderId });
        expect(payment.status).toBe('SUCCESS');
    });

    test('3. Webhook (Idempotency)', async () => {
        const payload = {
            event: 'payment.captured',
            payload: {
                payment: { entity: { id: 'pay_mock_123', order_id: orderId, amount: 500000, status: 'captured' } }
            }
        };
        const signature = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
            .update(JSON.stringify(payload)).digest('hex');

        const res = await request(app).post('/api/payments/webhook')
            .set('x-razorpay-signature', signature)
            .send(payload);

        expect(res.status).toBe(200);
    });
});
