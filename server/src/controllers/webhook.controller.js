const crypto = require('crypto');
const Payment = require('../models/Payment');
const PG = require('../models/PG');
const Invoice = require('../models/Invoice');

// @desc    Handle Razorpay Webhooks
// @route   POST /api/payments/webhook
// @access  Public (Signature Verified)
exports.handleWebhook = async (req, res) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    // 1. Verify Signature
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(req.body))
        .digest('hex');

    if (signature !== expectedSignature) {
        console.error('[AUDIT] Received Invalid Webhook Signature');
        return res.status(400).json({ status: 'failure', message: 'Invalid Signature' });
    }

    const event = req.body.event;
    const payload = req.body.payload;

    console.info(`[AUDIT] Webhook Received: ${event}`);

    try {
        if (event === 'payment.captured') {
            await handlePaymentCaptured(payload.payment.entity);
        }

        // Return 200 OK immediately to Razorpay
        res.status(200).json({ status: 'ok' });

    } catch (error) {
        console.error('[AUDIT] Webhook Processing Error:', error);
        // Still return 200 to prevent Razorpay retries if it's a logic error, 
        // unless it's a transient DB error (500)
        res.status(500).json({ status: 'error' });
    }
};

// Logic to Reconcile / Self-Heal with ACID Transactions
const handlePaymentCaptured = async (paymentEntity) => {
    const orderId = paymentEntity.order_id;
    const paymentId = paymentEntity.id;
    const mongoose = require('mongoose');

    const payment = await Payment.findOne({ gateway_order_id: orderId });

    if (!payment) {
        console.error(`[AUDIT] Webhook Error: Payment record not found for Order ${orderId}`);
        return;
    }

    // Idempotency: If already success, ignore
    if (payment.status === 'SUCCESS' && payment.subscription_processed) {
        console.info(`[AUDIT] Webhook Idempotency: Payment ${orderId} already processed.`);
        return;
    }

    console.warn(`[AUDIT] WEBHOOK RECOVERY: Activating Subscription for ${orderId}`);

    // Start ACID Transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        payment.status = 'SUCCESS';
        payment.gateway_payment_id = paymentId;

        if (payment.type === 'SUBSCRIPTION') {
            const planType = payment.metadata?.planType;
            if (planType) {
                const pg = await PG.findById(payment.pg_id).session(session);
                if (pg) {
                    const now = new Date();
                    let newExpiry = new Date();

                    if (pg.subscription.status === 'active' && pg.subscription.expiryDate > now) {
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
                    payment.subscription_processed = true;
                }
            }
        }
        
        await payment.save({ session });
        await session.commitTransaction();
        console.info(`[AUDIT] WEBHOOK RECOVERY COMPLETE: ${orderId}`);
    } catch (error) {
        await session.abortTransaction();
        console.error(`[AUDIT] WEBHOOK TRANSACTION FAILED: ${orderId}`, error);
        throw error;
    } finally {
        session.endSession();
    }
};
