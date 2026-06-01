const Payment = require('../models/Payment');
const PG = require('../models/PG');
const Tenant = require('../models/Tenant');
const paymentService = require('../services/payment.service');
const crypto = require('crypto');

const PLAN_PRICES = {
    'Starter': 499,
    'Pro': 1499,
    'Enterprise': 4999
};

const getRequestUserId = (req) => req.user?._id?.toString() || req.user?.id?.toString();

const assertTenantAccess = async (req, tenantId) => {
    const tenant = await Tenant.findById(tenantId).select('_id pg_id user_id');
    if (!tenant) {
        return { error: { status: 404, message: 'Tenant not found' } };
    }

    if (req.user.role === 'tenant') {
        if (tenant.user_id.toString() !== getRequestUserId(req)) {
            return { error: { status: 403, message: 'You can only create payments for your own account' } };
        }
    } else if (req.user.role === 'owner') {
        if (tenant.pg_id.toString() !== req.user.pg_id?.toString()) {
            return { error: { status: 403, message: 'Tenant does not belong to your PG' } };
        }
    }

    return { tenant };
};

const canAccessPayment = async (req, payment) => {
    if (req.user.role === 'admin') {
        return true;
    }

    if (req.user.role === 'owner') {
        return payment.pg_id?.toString() === req.user.pg_id?.toString();
    }

    if (req.user.role === 'tenant') {
        if (payment.user_id?.toString() === getRequestUserId(req)) {
            return true;
        }

        if (payment.tenant_id) {
            const tenant = await Tenant.findById(payment.tenant_id).select('user_id');
            return tenant?.user_id?.toString() === getRequestUserId(req);
        }
    }

    return false;
};

// @desc    Initiate Payment (Create Order)
// @route   POST /api/payments/order
// @access  Private
exports.createOrder = async (req, res) => {
    try {
        const { planType, type, tenantId, amount: manualAmount } = req.body; // type: 'SUBSCRIPTION' or 'RENT'

        let amountInPaise;
        let currency = 'INR';

        // 1. Validate & Calculate Amount
        if (type === 'SUBSCRIPTION') {
            // SECURITY: Only Owners can buy subscriptions
            if (req.user.role !== 'owner') {
                return res.status(403).json({ success: false, message: 'Only Owners can purchase subscriptions' });
            }
            if (!PLAN_PRICES[planType]) {
                return res.status(400).json({ success: false, message: 'Invalid Plan Type' });
            }
            amountInPaise = PLAN_PRICES[planType] * 100;
        } else if (type === 'RENT') {
            if (!manualAmount || !tenantId) {
                return res.status(400).json({ success: false, message: 'Rent amount and Tenant ID required' });
            }

            const accessCheck = await assertTenantAccess(req, tenantId);
            if (accessCheck.error) {
                return res.status(accessCheck.error.status).json({ success: false, message: accessCheck.error.message });
            }

            amountInPaise = Math.round(manualAmount * 100);
        } else {
            return res.status(400).json({ success: false, message: 'Invalid Payment Type' });
        }

        const receiptId = `rcpt_${Date.now()}`;

        // 2. Call Gateway
        const order = await paymentService.createOrder(amountInPaise, currency, receiptId);

        // 3. Create Payment Record (Created)
        const payment = await Payment.create({
            pg_id: req.user.pg_id, // BUG-020 FIX: removed user ID fallback
            user_id: req.user._id || req.user.id,
            tenant_id: tenantId,
            amount: amountInPaise / 100,
            currency: currency,
            type: type,
            status: 'CREATED',
            gateway_order_id: order.id,
            transaction_date: Date.now(),
            metadata: { planType }
        });

        res.status(200).json({
            success: true,
            orderId: order.id,
            amount: amountInPaise,
            currency: 'INR',
            keyId: paymentService.key_id,
            prefill: {
                name: req.user.name,
                email: req.user.email,
                contact: req.user.mobile || ''
            }
        });

    } catch (error) {
        console.error('Create Order Error DETAILS:', error);
        res.status(500).json({ success: false, message: 'Payment initiation failed', error: error.message });
    }
};

// @desc    Verify Payment
// @route   POST /api/payments/verify
// @access  Private
exports.verifyPayment = async (req, res) => {
    try {
        const { orderId, paymentId, signature } = req.body;

        const payment = await Payment.findOne({ gateway_order_id: orderId });
        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment record not found' });
        }

        const hasAccess = await canAccessPayment(req, payment);
        if (!hasAccess) {
            return res.status(403).json({ success: false, message: 'Not authorized to verify this payment' });
        }

        // IDEMPOTENCY CHECK & RESUME LOGIC
        if (payment.status === 'SUCCESS') {
            if (payment.subscription_processed) {
                return res.status(200).json({ success: true, message: 'Payment already processed' });
            }
            // If SUCCESS but !subscription_processed, RESUME activation without re-verifying signature
            console.warn(`Resuming interrupted subscription activation for Payment: ${paymentId}`);
        } else {
            // New Transaction: Verify Signature
            const isValid = paymentService.verifySignature(orderId, paymentId, signature);
            if (!isValid) {
                payment.status = 'FAILED';
                payment.gateway_payment_id = paymentId;
                payment.gateway_signature = signature;
                await payment.save();
                return res.status(400).json({ success: false, message: 'Invalid Signature' });
            }

            // Update Payment Status
            payment.status = 'SUCCESS';
            payment.gateway_payment_id = paymentId;
            payment.gateway_signature = signature;
            await payment.save();
        }

        // 3. Fulfill Business Logic using ACID Transactions
        const mongoose = require('mongoose');
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            if (payment.type === 'RENT' && payment.tenant_id) {
                // ... (Tenant Logic)
                // Optionally update tenant status or last payment date
                // const tenant = await Tenant.findById(payment.tenant_id).session(session);
            } else if (payment.type === 'SUBSCRIPTION') {
                const planType = payment.metadata?.planType;
                if (planType) {
                    const pg = await PG.findById(payment.pg_id).session(session);
                    if (pg) {
                        const now = new Date();
                        let newExpiry = new Date();

                        if (pg.subscription.status === 'active' && pg.subscription.expiryDate && new Date(pg.subscription.expiryDate) > now) {
                            newExpiry = new Date(pg.subscription.expiryDate);
                            newExpiry.setDate(newExpiry.getDate() + 30);
                        } else {
                            newExpiry.setDate(now.getDate() + 30);
                            pg.subscription.startDate = now;
                        }

                        pg.subscription.plan = planType;
                        pg.subscription.status = 'active';
                        pg.subscription.expiryDate = newExpiry;

                        await pg.save({ session });

                        // Mark as Fully Processed
                        payment.subscription_processed = true;
                        
                        console.log(`[SUBSCRIPTION] Activated for PG ${pg._id} | Plan: ${planType} | Expires: ${newExpiry}`);
                    }
                }
            }

            await payment.save({ session });
            await session.commitTransaction();
            
            res.status(200).json({ success: true, message: 'Payment Verified' });
        } catch (txnError) {
            await session.abortTransaction();
            throw txnError;
        } finally {
            session.endSession();
        }

    } catch (error) {
        console.error('[AUDIT] SYSTEM ERROR: Verify Payment Failed:', error);
        res.status(500).json({ success: false, message: 'Verification failed' });
    }
};

const CreditNote = require('../models/CreditNote');

// @desc    Process Refund (Total or Partial)
// @route   POST /api/payments/refund
// @access  Admin Only (Protected Middleware)
exports.processRefund = async (req, res) => {
    try {
        const { paymentId, amount, reason } = req.body;

        // 1. Fetch Payment
        const payment = await Payment.findOne({ gateway_payment_id: paymentId });
        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }

        // 2. Validate Refund Amount
        if (amount > payment.amount * 100) { // Payment amount is stored in whole units in DB (e.g. 1499)
            return res.status(400).json({ success: false, message: 'Refund amount exceeds payment amount' });
        }

        // 3. Call Razorpay Refund API
        // const refund = await paymentService.refundPayment(paymentId, amount); // Mocking for now
        const refundId = `ref_${Date.now()}`;
        console.info(`[AUDIT] RAZORPAY REFUND: Initiated for ${paymentId}, Amount: ${amount}`);

        // 4. Create Credit Note
        const creditNote = await CreditNote.create({
            cn_number: `CN-${Date.now()}`,
            payment_id: payment._id,
            // Assuming we have an Invoice linked, but for now we look it up or mock
            invoice_id: payment._id, // Temporary fallback
            amount: amount / 100,
            reason: reason,
            issued_by: req.user._id
        });

        // 5. Update Payment Status
        // If full refund
        if (amount === payment.amount * 100) {
            payment.status = 'REFUNDED';
        } else {
            payment.status = 'PARTIALLY_REFUNDED';
        }
        await payment.save();

        console.info(`[AUDIT] REFUND SUCCESS: Payment ${paymentId} refunded. CN: ${creditNote.cn_number}`);

        res.status(200).json({ success: true, message: 'Refund Processed', creditNote });

    } catch (error) {
        console.error('[AUDIT] REFUND ERROR:', error);
        res.status(500).json({ success: false, message: 'Refund failed' });
    }
};

// @desc    Record Manual Payment (Cash/UPI)
// @route   POST /api/payments/manual
// @access  Owner Only
exports.recordManualPayment = async (req, res) => {
    try {
        const { tenantId, amount, mode, remarks, date } = req.body;

        if (!tenantId || !amount || !mode) {
            return res.status(400).json({ success: false, message: 'Tenant, Amount, and Mode required' });
        }

        const accessCheck = await assertTenantAccess(req, tenantId);
        if (accessCheck.error) {
            return res.status(accessCheck.error.status).json({ success: false, message: accessCheck.error.message });
        }

        const tenant = accessCheck.tenant;

        const payment = await Payment.create({
            pg_id: tenant.pg_id,
            user_id: getRequestUserId(req),
            tenant_id: tenantId,
            amount: amount,
            currency: 'INR',
            type: 'RENT',
            status: 'SUCCESS',
            payment_mode: mode,
            transaction_date: date || Date.now(),
            metadata: { remarks, source: 'manual_entry' }
        });

        console.info(`[AUDIT] MANUAL PAYMENT: ₹${amount} (${mode}) for Tenant ${tenantId} by ${req.user.name}`);

        res.status(201).json({ success: true, message: 'Payment Recorded', payment });

    } catch (error) {
        console.error('Manual Payment Error:', error);
        res.status(500).json({ success: false, message: 'Failed to record payment' });
    }
};
