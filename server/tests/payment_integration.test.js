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
const TENANT_USER = { name: "Pay Test Tenant", email: `paytest_${Date.now()}@test.com`, password: "password123", role: "tenant" };

describe('💳 Payment Integration Tests', () => {
    let token, tenantId;

    beforeAll(async () => {
        try {
            console.log("🔵 SETUP: Starting In-Memory Replica Set...");
            await dbHandler.connect();
            console.log("✅ SETUP: DB Connected (Replica Set)");

            console.log("🔵 SETUP: Registering Tenant...");
            const res = await request(app).post('/api/auth/register').send(TENANT_USER);
            if (res.status !== 201) {
                console.error("❌ SETUP FAILED: Register Tenant:", res.body);
                throw new Error("Failed to register tenant: " + JSON.stringify(res.body));
            }

            const tenantUserId = res.body.data.user ? res.body.data.user._id : res.body.data._id;
            token = res.body.data.token;

            const pg = await PG.create({
                name: 'Payment Test PG',
                address: '123 Test Street',
                city: 'Test City',
                type: 'Both',
                owner_id: tenantUserId
            });

            const room = await Room.create({
                pg_id: pg._id,
                number: '101',
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
            console.log("✅ SETUP: Tenant profile ready.");
        } catch (e) {
            console.error("❌ BEFORE_ALL ERROR:", e);
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

        if (res.status !== 200) console.error("❌ CREATE ORDER ERROR:", JSON.stringify(res.body, null, 2));
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.orderId).toBeDefined();

        orderId = res.body.orderId;

        // Verify DB Record Created
        const payment = await Payment.findOne({ gateway_order_id: orderId });
        expect(payment).toBeTruthy();
        expect(payment.status).toBe('CREATED');
        expect(payment.amount).toBe(5000);
    });

    test('2. Verify Payment (Valid Signature)', async () => {
        // Generate valid signature using helper or manually
        const signature = paymentService.key_secret === 'mock_key_secret'
            ? 'mock_signature'
            : crypto.createHmac('sha256', paymentService.key_secret)
                .update(orderId + '|' + 'pay_test_123')
                .digest('hex');

        const res = await request(app).post('/api/payments/verify')
            .set('Authorization', `Bearer ${token}`)
            .send({
                orderId: orderId,
                paymentId: 'pay_test_123',
                signature: signature
            });

        if (res.status !== 200) console.error("Verify Failed:", res.body);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        // Verify DB Updated
        const payment = await Payment.findOne({ gateway_order_id: orderId });
        expect(payment.status).toBe('SUCCESS');
        expect(payment.gateway_payment_id).toBe('pay_test_123');
    });

    test('3. Webhook: Payment Captured (Idempotency)', async () => {
        const payload = {
            event: 'payment.captured',
            payload: {
                payment: {
                    entity: {
                        id: 'pay_test_123',
                        order_id: orderId,
                        amount: 500000,
                        status: 'captured'
                    }
                }
            }
        };

        // Ensure Secret Match (Mock)
        process.env.RAZORPAY_WEBHOOK_SECRET = 'mock_webhook_secret';

        const signature = crypto.createHmac('sha256', 'mock_webhook_secret')
            .update(JSON.stringify(payload))
            .digest('hex');

        const res = await request(app).post('/api/payments/webhook')
            .set('x-razorpay-signature', signature)
            .send(payload);

        expect(res.status).toBe(200);
        // DB Status should remain SUCCESS
        const payment = await Payment.findOne({ gateway_order_id: orderId });
        expect(payment.status).toBe('SUCCESS');
    });

    test('4. Webhook: Payment Captured (Self-Healing)', async () => {
        // Create a stalled payment
        const stalledOrderId = `order_stalled_${Date.now()}`;
        await Payment.create({
            pg_id: new mongoose.Types.ObjectId(),
            user_id: new mongoose.Types.ObjectId(),
            amount: 1000,
            currency: 'INR',
            type: 'RENT',
            status: 'CREATED', // Stalled
            gateway_order_id: stalledOrderId,
            tenant_id: new mongoose.Types.ObjectId(),
            transaction_date: Date.now()
        });

        const payload = {
            event: 'payment.captured',
            payload: {
                payment: {
                    entity: {
                        id: 'pay_healed_123',
                        order_id: stalledOrderId,
                        amount: 100000,
                        status: 'captured'
                    }
                }
            }
        };

        const signature = crypto.createHmac('sha256', 'mock_webhook_secret')
            .update(JSON.stringify(payload))
            .digest('hex');

        const res = await request(app).post('/api/payments/webhook')
            .set('x-razorpay-signature', signature)
            .send(payload);

        expect(res.status).toBe(200);

        // Verify Healed
        const payment = await Payment.findOne({ gateway_order_id: stalledOrderId });
        expect(payment.status).toBe('SUCCESS');
        expect(payment.gateway_payment_id).toBe('pay_healed_123');
    });
});
