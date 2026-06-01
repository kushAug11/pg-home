const mongoose = require('mongoose');
const MessMenu = require('../models/MessMenu');
const MessAttendance = require('../models/MessAttendance');
const Tenant = require('../models/Tenant');
const MealVoucher = require('../models/MealVoucher');
const crypto = require('crypto');

// Get Menu (Weekly or Specific Date)
exports.getMenu = async (req, res) => {
    try {
        const { date, startDate, endDate } = req.query;
        const pg_id = req.user.pg_id;

        let query = { pg_id };

        if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            query.date = { $gte: start, $lte: end };
        } else if (date) {
            const queryDate = new Date(date);
            queryDate.setHours(0, 0, 0, 0);
            query.date = queryDate;
        }

        const menus = await MessMenu.find(query).sort({ date: 1 });
        res.json(menus);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update/Create Menu
exports.updateMenu = async (req, res) => {
    try {
        const { date, meals } = req.body;
        const pg_id = req.user.pg_id;

        const menuDate = new Date(date);
        menuDate.setHours(0, 0, 0, 0);

        const menu = await MessMenu.findOneAndUpdate(
            { pg_id, date: menuDate },
            { meals },
            { new: true, upsert: true }
        );

        res.json(menu);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Mark Attendance (Skip Meal)
exports.markAttendance = async (req, res) => {
    try {
        const { date, meal_type, status } = req.body;
        const pg_id = req.user.pg_id;

        // If user is tenant, use their ID. If Owner marking for tenant, need tenant_id in body
        let tenant_id = req.user.id;
        if (req.user.role === 'owner' && req.body.tenant_id) {
            tenant_id = req.body.tenant_id;
        } else if (req.user.role === 'owner' && !req.body.tenant_id) {
            return res.status(400).json({ message: 'Tenant ID required for owner action' });
        }

        const attendDate = new Date(date);
        attendDate.setHours(0, 0, 0, 0);

        const attendance = await MessAttendance.findOneAndUpdate(
            { pg_id, tenant_id, date: attendDate, meal_type },
            { status, updatedAt: Date.now() },
            { new: true, upsert: true }
        );

        res.json(attendance);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get Analytics (Who is eating today?)
exports.getMessAnalytics = async (req, res) => {
    try {
        const { date } = req.query;
        const pg_id = req.user.pg_id;

        const queryDate = new Date(date || Date.now());
        queryDate.setHours(0, 0, 0, 0);

        // 1. Get Total Active Tenants
        const totalTenants = await Tenant.countDocuments({ pg_id, status: 'active' });

        // 2. Get Skipped Counts for each meal type
        const skipped = await MessAttendance.aggregate([
            {
                $match: {
                    pg_id: new mongoose.Types.ObjectId(pg_id),
                    date: queryDate,
                    status: 'skipped'
                }
            },
            {
                $group: {
                    _id: '$meal_type',
                    count: { $sum: 1 }
                }
            }
        ]);

        const skippedMap = {};
        skipped.forEach(item => {
            skippedMap[item._id] = item.count;
        });

        const meals = ['breakfast', 'lunch', 'dinner'];
        const analytics = meals.map(meal => ({
            meal,
            total: totalTenants,
            skipped: skippedMap[meal] || 0,
            eating: totalTenants - (skippedMap[meal] || 0)
        }));

        res.json({
            date: queryDate,
            stats: analytics
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Purchase Meal Voucher (Tenant Action)
exports.purchaseVoucher = async (req, res) => {
    try {
        const { mealType, price, isGuestVoucher, guestName } = req.body;
        const tenant = await Tenant.findOne({ user_id: req.user._id || req.user.id });

        if (!tenant) {
            return res.status(404).json({ success: false, message: 'Tenant profile not found' });
        }

        // Generate unique cryptographically secure voucher code
        const voucherCode = 'meal_coup_' + crypto.randomBytes(6).toString('hex');

        const voucher = await MealVoucher.create({
            pg_id: tenant.pg_id,
            tenant_id: tenant._id,
            mealType,
            price: price || 0,
            isGuestVoucher: !!isGuestVoucher,
            guestName: guestName || '',
            voucherCode
        });

        res.status(201).json({ success: true, data: voucher });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Get My Meal Vouchers (Tenant Action)
exports.getMyVouchers = async (req, res) => {
    try {
        const tenant = await Tenant.findOne({ user_id: req.user._id || req.user.id });
        if (!tenant) {
            return res.status(404).json({ success: false, message: 'Tenant profile not found' });
        }

        const vouchers = await MealVoucher.find({ tenant_id: tenant._id }).sort({ purchaseDate: -1 });
        res.json({ success: true, data: vouchers });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Get All Vouchers for PG (Owner Action)
exports.getVouchersList = async (req, res) => {
    try {
        const pg_id = req.user.pg_id;
        const vouchers = await MealVoucher.find({ pg_id })
            .populate({
                path: 'tenant_id',
                select: 'user_id room_id',
                populate: [
                    {
                        path: 'user_id',
                        select: 'name email'
                    },
                    {
                        path: 'room_id',
                        select: 'number'
                    }
                ]
            })
            .sort({ purchaseDate: -1 });
        res.json(vouchers);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Verify and Use Voucher (Owner/Guard Action)
exports.verifyVoucher = async (req, res) => {
    try {
        const { voucherCode } = req.body;
        const pg_id = req.user.pg_id;

        if (!voucherCode) {
            return res.status(400).json({ message: 'Voucher code is required' });
        }

        const voucher = await MealVoucher.findOne({ voucherCode, pg_id, status: { $in: ['UNUSED', 'BILLED'] } })
            .populate({
                path: 'tenant_id',
                select: 'user_id room_id',
                populate: [
                    {
                        path: 'user_id',
                        select: 'name'
                    },
                    {
                        path: 'room_id',
                        select: 'number'
                    }
                ]
            });

        if (!voucher) {
            return res.status(404).json({ message: 'Invalid, already used, or expired meal voucher' });
        }

        voucher.status = 'USED';
        voucher.useDate = Date.now();
        await voucher.save();

        res.json({
            success: true,
            message: 'Meal voucher verified and marked as USED successfully',
            voucher
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
