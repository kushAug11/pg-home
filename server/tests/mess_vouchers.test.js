const request = require('supertest');
const app = require('../src/app');
const dbHandler = require('./utils/db-handler');
const User = require('../src/models/User');
const PG = require('../src/models/PG');
const Room = require('../src/models/Room');
const Tenant = require('../src/models/Tenant');
const MealVoucher = require('../src/models/MealVoucher');
const Payment = require('../src/models/Payment');
const emailService = require('../src/services/email.service');

// Mock email
jest.mock('../src/services/email.service', () => ({
    sendWelcomeEmail: jest.fn(),
    sendAccountSetupEmail: jest.fn(),
    sendOTP: jest.fn()
}));

// DB Setup
beforeAll(async () => await dbHandler.connect());
afterEach(async () => {
    await dbHandler.clearDatabase();
    jest.clearAllMocks();
});
afterAll(async () => await dbHandler.closeDatabase());

describe('Mess Meal Vouchers & Operations Integration Tests', () => {
    let ownerToken;
    let tenantToken;
    let pgId;
    let tenantRecord;

    beforeEach(async () => {
        jest.clearAllMocks();
        // 1. Register Owner
        const ownerRes = await request(app).post('/api/auth/register').send({
            name: 'Mess Manager',
            email: 'mess@test.com',
            password: 'password123',
            role: 'owner',
            pgName: 'Spicy Delights Hostel'
        });
        ownerToken = ownerRes.body.data.token;
        pgId = ownerRes.body.data.pg_id;

        // 2. Upgrade Subscription
        await PG.findByIdAndUpdate(pgId, {
            'subscription.plan': 'Pro',
            'subscription.status': 'active',
            'subscription.expiryDate': new Date(Date.now() + 999999999)
        });

        // 3. Add Room
        const roomRes = await request(app)
            .post('/api/owner/rooms')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ roomNumber: '101', type: 'Single', rent: 5000, capacity: 1 });
        const roomId = roomRes.body.data._id;

        // 4. Add Tenant
        const addTenantRes = await request(app)
            .post('/api/owner/tenants')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({
                name: 'Foodie Frank',
                email: 'frank@test.com',
                password: 'ignored_password',
                mobile: '9988776655',
                room_id: roomId,
                rentAmount: 5000,
                deposit: 10000
            });

        // 5. Generate a valid activation token using tokenService directly
        const userRecord = await User.findOne({ email: 'frank@test.com' });
        if (!userRecord) {
            console.log("❌ DEBUG: Tenant Add Response status:", addTenantRes.statusCode, "body:", addTenantRes.body);
        }
        const { createActivationToken } = require('../src/services/token.service');
        const setupToken = await createActivationToken(userRecord);

        // 6. Setup Account
        await request(app).post('/api/auth/setup-account').send({
            token: setupToken,
            password: 'newSecurePassword123'
        });

        // 7. Tenant Login
        const loginRes = await request(app).post('/api/auth/login').send({
            email: 'frank@test.com',
            password: 'newSecurePassword123'
        });

        tenantToken = loginRes.body.data.token;
        tenantRecord = await Tenant.findOne({ user_id: loginRes.body.data._id });
    });

    describe('Tenant: Meal Voucher Ordering', () => {
        it('should allow tenant to purchase a personal lunch coupon billed to rent', async () => {
            const res = await request(app)
                .post('/api/mess/vouchers')
                .set('Authorization', `Bearer ${tenantToken}`)
                .send({
                    mealType: 'Lunch',
                    price: 80,
                    isGuestVoucher: false
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.mealType).toBe('Lunch');
            expect(res.body.data.price).toBe(80);
            expect(res.body.data.status).toBe('UNUSED');
            expect(res.body.data.voucherCode).toMatch(/^meal_coup_/);
        });

        it('should allow tenant to purchase a guest breakfast coupon billed to rent', async () => {
            const res = await request(app)
                .post('/api/mess/vouchers')
                .set('Authorization', `Bearer ${tenantToken}`)
                .send({
                    mealType: 'Breakfast',
                    price: 50,
                    isGuestVoucher: true,
                    guestName: 'Mary Frank (Mother)'
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.isGuestVoucher).toBe(true);
            expect(res.body.data.guestName).toBe('Mary Frank (Mother)');
        });
    });

    describe('Financial: Dynamic Bill Packing & Auto-Settlement', () => {
        beforeEach(async () => {
            // Purchase 2 meal coupons: Lunch (₹80) and Dinner (₹80) = ₹160 total dues
            await MealVoucher.create({
                pg_id: pgId,
                tenant_id: tenantRecord._id,
                mealType: 'Lunch',
                price: 80,
                voucherCode: 'meal_coup_lunch123'
            });

            await MealVoucher.create({
                pg_id: pgId,
                tenant_id: tenantRecord._id,
                mealType: 'Dinner',
                price: 80,
                voucherCode: 'meal_coup_dinner123'
            });
        });

        it('should dynamically calculate total rent + mess dues in getPayments', async () => {
            const res = await request(app)
                .get('/api/tenant/payments')
                .set('Authorization', `Bearer ${tenantToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.rentAmount).toBe(5000);
            expect(res.body.data.messDues).toBe(160);
            expect(res.body.data.activeVouchersCount).toBe(2);
        });

        it('should initiate payment carrying packed rent + mess dues total amount', async () => {
            const res = await request(app)
                .post('/api/tenant/pay-rent')
                .set('Authorization', `Bearer ${tenantToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            // Packed amount should be ₹5000 + ₹160 = ₹5160
            const localPayment = await Payment.findOne({ gateway_order_id: res.body.order_id });
            expect(localPayment.amount).toBe(5160);
            expect(localPayment.metadata.messDues).toBe(160);
            expect(localPayment.metadata.voucherIds.length).toBe(2);
        });

        it('should automatically mark vouchers as BILLED when rent payment is successfully verified', async () => {
            // 1. Create packed payment
            const payRes = await request(app)
                .post('/api/tenant/pay-rent')
                .set('Authorization', `Bearer ${tenantToken}`);
            const orderId = payRes.body.order_id;

            // 2. Verify payment signature
            const verifyRes = await request(app)
                .post('/api/tenant/verify-payment')
                .set('Authorization', `Bearer ${tenantToken}`)
                .send({
                    razorpay_order_id: orderId,
                    razorpay_payment_id: 'pay_mock_' + Date.now(),
                    razorpay_signature: 'mock_signature'
                });

            expect(verifyRes.statusCode).toBe(200);
            expect(verifyRes.body.success).toBe(true);

            // 3. Confirm all vouchers are BILLED
            const vouchers = await MealVoucher.find({ tenant_id: tenantRecord._id });
            expect(vouchers.length).toBe(2);
            expect(vouchers[0].status).toBe('BILLED');
            expect(vouchers[1].status).toBe('BILLED');
        });
    });

    describe('Owner/Guard: Verification & Redemption', () => {
        let couponCode;

        beforeEach(async () => {
            const voucher = await MealVoucher.create({
                pg_id: pgId,
                tenant_id: tenantRecord._id,
                mealType: 'Lunch',
                price: 80,
                voucherCode: 'meal_coup_uniquecode'
            });
            couponCode = voucher.voucherCode;
        });

        it('should allow owner to list all meal vouchers inside the PG', async () => {
            const res = await request(app)
                .get('/api/mess/vouchers')
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.length).toBe(1);
            expect(res.body[0].voucherCode).toBe(couponCode);
            expect(res.body[0].tenant_id?.user_id?.name).toBe('Foodie Frank');
        });

        it('should allow owner/guard to verify and redeem unused vouchers', async () => {
            const res = await request(app)
                .post('/api/mess/vouchers/verify')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ voucherCode: couponCode });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.voucher.status).toBe('USED');
            expect(res.body.voucher.useDate).toBeDefined();

            // Settle check in DB
            const voucher = await MealVoucher.findOne({ voucherCode: couponCode });
            expect(voucher.status).toBe('USED');
        });

        it('should reject redemption of already used/billed vouchers', async () => {
            // First redemption
            await request(app)
                .post('/api/mess/vouchers/verify')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ voucherCode: couponCode });

            // Second redemption
            const res = await request(app)
                .post('/api/mess/vouchers/verify')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ voucherCode: couponCode });

            expect(res.statusCode).toBe(404);
            expect(res.body.message).toContain('Invalid, already used');
        });
    });
});
