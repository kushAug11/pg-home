const Tenant = require('../models/Tenant');
const Room = require('../models/Room');
const Payment = require('../models/Payment');
const Complaint = require('../models/Complaint');
const Notice = require('../models/Notice');
const HousekeepingLog = require('../models/HousekeepingLog');
const paymentService = require('../services/payment.service');
const crypto = require('crypto');

// Initialize Razorpay (Moved inside function to safe-guard against missing keys)
// const razorpay = new Razorpay({
//     key_id: process.env.RAZORPAY_KEY_ID,
//     key_secret: process.env.RAZORPAY_KEY_SECRET
// });

// @desc    Get Tenant Dashboard Data
// @route   GET /api/tenant/dashboard
// @access  Private (Tenant)
exports.getDashboard = async (req, res) => {
    try {
        const tenant = await Tenant.findOne({ user_id: req.user._id })
            .populate('room_id')
            .populate('pg_id', 'name address contact');

        if (!tenant) {
            return res.status(404).json({ success: false, message: 'Tenant record not found' });
        }

        // Get recent data in parallel
        const [payments, complaints, lastCleaned] = await Promise.all([
            // 1. Recent payments
            Payment.find({ tenant_id: tenant._id })
                .sort({ transaction_date: -1 })
                .limit(5),
            // 2. Recent complaints
            Complaint.find({ tenant_id: tenant._id })
                .sort({ createdAt: -1 })
                .limit(5),
            // 3. Last Cleaned Status
            HousekeepingLog.findOne({
                room_id: tenant.room_id,
                status: 'Cleaned'
            }).sort({ date: -1 })
        ]);

        res.json({
            success: true,
            data: {
                tenant,
                room: tenant.room_id,
                pg: tenant.pg_id,
                recentPayments: payments,
                recentComplaints: complaints,
                lastCleaned: lastCleaned ? lastCleaned.date : null
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Initiate Rent Payment
// @route   POST /api/tenant/pay-rent
// @access  Private (Tenant)
exports.initiateRentPayment = async (req, res) => {
    try {
        const tenant = await Tenant.findOne({ user_id: req.user._id });
        if (!tenant) {
            return res.status(404).json({ success: false, message: 'Tenant record not found' });
        }

        // Sum all active (unbilled) meal vouchers
        const MealVoucher = require('../models/MealVoucher');
        const activeVouchers = await MealVoucher.find({ tenant_id: tenant._id, status: { $ne: 'BILLED' } });
        const messDues = activeVouchers.reduce((sum, v) => sum + v.price, 0);
        const totalAmount = tenant.rentAmount + messDues;

        // Create Mock Receipt
        const receiptId = `receipt_rent_${tenant._id}_${Date.now()}`;

        // Use Service
        const order = await paymentService.createOrder(totalAmount * 100, 'INR', receiptId);

        // Create local payment record
        await Payment.create({
            pg_id: tenant.pg_id,
            user_id: req.user._id,
            tenant_id: tenant._id,
            amount: totalAmount,
            type: 'RENT',
            status: 'CREATED',
            gateway_order_id: order.id,
            metadata: {
                rentAmount: tenant.rentAmount,
                messDues: messDues,
                voucherIds: activeVouchers.map(v => v._id.toString())
            }
        });

        res.json({
            success: true,
            order_id: order.id,
            amount: order.amount,
            key_id: paymentService.key_id // Send Key ID to frontend for Mock Detection
        });

    } catch (error) {
        console.error('Payment Init Error:', error);
        res.status(500).json({ success: false, message: 'Payment initiation failed' });
    }
};

// @desc    Verify Payment
// @route   POST /api/tenant/verify-payment
// @access  Private (Tenant)
exports.verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        // BUG-019 FIX: Verify the payment belongs to this tenant before updating
        const payment = await Payment.findOne({ gateway_order_id: razorpay_order_id });
        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }

        // Ownership check: payment.user_id must match requesting user
        const userId = (req.user._id || req.user.id).toString();
        if (payment.user_id.toString() !== userId) {
            return res.status(403).json({ success: false, message: 'Not authorized to verify this payment' });
        }

        const isValid = paymentService.verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);

        if (isValid) {
            payment.status = 'SUCCESS';
            payment.gateway_payment_id = razorpay_payment_id;
            payment.gateway_signature = razorpay_signature;
            payment.transaction_date = Date.now();
            await payment.save();

            // Mark vouchers as BILLED upon payment success
            if (payment.metadata && payment.metadata.voucherIds && payment.metadata.voucherIds.length > 0) {
                const MealVoucher = require('../models/MealVoucher');
                await MealVoucher.updateMany(
                    { _id: { $in: payment.metadata.voucherIds } },
                    { $set: { status: 'BILLED' } }
                );
            }

            res.json({ success: true, message: 'Payment verified successfully' });
        } else {
            payment.status = 'FAILED';
            await payment.save();
            res.status(400).json({ success: false, message: 'Invalid signature' });
        }
    } catch (error) {
        console.error('Verification Error:', error);
        res.status(500).json({ success: false, message: 'Verification failed' });
    }
};


// @desc    Data for Pay Rent Page (History + Due)
// @route   GET /api/tenant/payments
// @access  Private (Tenant)
exports.getPayments = async (req, res) => {
    try {
        const tenant = await Tenant.findOne({ user_id: req.user._id });
        if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });

        const payments = await Payment.find({ tenant_id: tenant._id }).sort({ transaction_date: -1 });

        // Sum unpaid meal vouchers
        const MealVoucher = require('../models/MealVoucher');
        const activeVouchers = await MealVoucher.find({ tenant_id: tenant._id, status: { $ne: 'BILLED' } });
        const messDues = activeVouchers.reduce((sum, v) => sum + v.price, 0);

        res.json({
            success: true,
            data: {
                rentAmount: tenant.rentAmount,
                messDues,
                activeVouchersCount: activeVouchers.length,
                payments
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Raise a Complaint
// @route   POST /api/tenant/complaints
// @access  Private (Tenant)
exports.raiseComplaint = async (req, res) => {
    try {
        const { title, description, category, priority } = req.body;
        const tenant = await Tenant.findOne({ user_id: req.user._id });

        if (!tenant) {
            return res.status(404).json({ success: false, message: 'Tenant record not found' });
        }

        const complaint = await Complaint.create({
            pg_id: tenant.pg_id,
            tenant_id: tenant._id,
            title,
            description,
            category: category || 'Other',
            priority: priority || 'Medium'
        });

        res.status(201).json({ success: true, data: complaint });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to raise complaint' });
    }
};

// @desc    Get Complaints History
// @route   GET /api/tenant/complaints
// @access  Private (Tenant)
exports.getComplaints = async (req, res) => {
    try {
        const tenant = await Tenant.findOne({ user_id: req.user._id });
        if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });

        const complaints = await Complaint.find({ tenant_id: tenant._id }).sort({ createdAt: -1 });
        res.json({ success: true, data: complaints });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get Notices for Tenant
// @route   GET /api/tenant/notices
// @access  Private (Tenant)
exports.getNotices = async (req, res) => {
    try {
        const tenant = await Tenant.findOne({ user_id: req.user._id });
        if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });

        const notices = await Notice.find({ pg_id: tenant.pg_id })
            .sort({ createdAt: -1 })
            .limit(10); // Limit to last 10 notices

        res.json({ success: true, data: notices });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
// @desc    Request Exit / Notice Period
// @route   POST /api/tenant/request-exit
// @access  Private (Tenant)
exports.requestExit = async (req, res) => {
    try {
        const { reason, date } = req.body;
        const tenant = await Tenant.findOne({ user_id: req.user._id });

        if (!tenant) {
            return res.status(404).json({ success: false, message: 'Tenant not found' });
        }

        if (tenant.exit_request && tenant.exit_request.status === 'PENDING') {
            return res.status(400).json({ success: false, message: 'Exit request already pending' });
        }

        tenant.exit_request = {
            status: 'PENDING',
            reason,
            requested_date: date,
            request_date: Date.now()
        };

        await tenant.save();

        res.json({ success: true, message: 'Exit request submitted successfully', data: tenant });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

const PreAuthVisitor = require('../models/PreAuthVisitor');

// @desc    Get Tenant Pre-Authorized Visitors List
// @route   GET /api/tenant/preauth-visitors
// @access  Private (Tenant)
exports.getPreAuthVisitors = async (req, res) => {
    try {
        const tenant = await Tenant.findOne({ user_id: req.user._id });
        if (!tenant) return res.status(404).json({ success: false, message: 'Tenant record not found' });

        const visitors = await PreAuthVisitor.find({ tenant_id: tenant._id }).sort({ createdAt: -1 });
        res.json({ success: true, data: visitors });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Create Tenant Pre-Authorized Visitor Pass
// @route   POST /api/tenant/preauth-visitors
// @access  Private (Tenant)
exports.createPreAuthVisitor = async (req, res) => {
    try {
        const { name, phone, purpose, visitDate } = req.body;
        const tenant = await Tenant.findOne({ user_id: req.user._id });
        if (!tenant) return res.status(404).json({ success: false, message: 'Tenant record not found' });

        // Generate unique token
        const qrCodeToken = 'pass_' + crypto.randomBytes(8).toString('hex');

        const newPass = await PreAuthVisitor.create({
            pg_id: tenant.pg_id,
            tenant_id: tenant._id,
            name,
            phone,
            purpose: purpose || 'Visit',
            visitDate: visitDate || Date.now(),
            qrCodeToken
        });

        res.status(201).json({ success: true, data: newPass });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
