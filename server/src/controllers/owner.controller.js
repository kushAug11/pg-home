const mongoose = require('mongoose');
const Room = require('../models/Room');
const PG = require('../models/PG');
const User = require('../models/User');
const Tenant = require('../models/Tenant');
const Complaint = require('../models/Complaint');
const Notice = require('../models/Notice');
const Expense = require('../models/Expense');
const Payment = require('../models/Payment');
const bcrypt = require('bcryptjs');
const emailService = require('../services/email.service');
const crypto = require('crypto');
const OnboardingAnalytics = require('../models/OnboardingAnalytics');
const tokenService = require('../services/token.service');
const communicationService = require('../services/communication.service');
const { PLAN_LIMITS } = require('../config/plans');
const roomService = require('../services/room.service');

// @desc    Get all rooms for the owner's PG
// @route   GET /api/owner/rooms
// @access  Private (Owner)
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all rooms for the owner's PG
// @route   GET /api/owner/rooms
// @access  Private (Owner)
exports.getRooms = asyncHandler(async (req, res) => {
  const rooms = await Room.find({ pg_id: req.user.pg_id });
  res.status(200).json({ success: true, count: rooms.length, data: rooms });
});

// @desc    Create a new room
// @route   POST /api/owner/rooms
// @access  Private (Owner)
// @desc    Create a new room
// @route   POST /api/owner/rooms
// @access  Private (Owner)
exports.createRoom = asyncHandler(async (req, res) => {
  const room = await roomService.createRoom(req.user.pg_id, req.body);
  res.status(201).json({ success: true, data: room });
});

// @desc    Update room details
// @route   PUT /api/owner/rooms/:id
// @access  Private (Owner)
exports.updateRoom = asyncHandler(async (req, res) => {
  const room = await roomService.updateRoom(req.params.id, req.user.pg_id, req.body);
  res.status(200).json({ success: true, data: room });
});

// @desc    Delete room
// @route   DELETE /api/owner/rooms/:id
// @access  Private (Owner)
exports.deleteRoom = asyncHandler(async (req, res) => {
  const { deletedTenantsCount } = await roomService.deleteRoom(req.params.id, req.user.pg_id);
  res.status(200).json({ success: true, message: `Room and ${deletedTenantsCount} associated tenants deleted` });
});

// @desc    Get all tenants
// @route   GET /api/owner/tenants
// @access  Private (Owner)
exports.getTenants = async (req, res) => {
  try {
    const tenants = await Tenant.find({ pg_id: req.user.pg_id })
      .populate('user_id', 'name email')
      .populate('room_id', 'number');
    res.status(200).json({ success: true, count: tenants.length, data: tenants });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

/**
 * @desc    Add a new tenant
 * @route   POST /api/owner/tenants
 * @access  Private (Owner)
 * @description
 * Orchestra complex onboarding flow:
 * 1. Validates Room capacity and existing users.
 * 2. Uses Atomic Transaction to create User and Tenant profile.
 * 3. Handles "Orphaned" accounts if a previous tenant add failed.
 * 4. Triggers async email/WhatsApp notifications.
 * 
 * @param {string} name - Tenant Name
 * @param {string} email - Unique Email
 * @param {string} mobile - Contact Number
 * @param {ObjectId} room_id - Room to assign
 */
exports.addTenant = async (req, res, next) => {
  try {
    const { name, email, password, mobile, room_id, rentAmount, deposit } = req.body;

    // VALIDATION
    if (rentAmount < 0) {
      return res.status(400).json({ success: false, message: 'Rent amount cannot be negative' });
    }
    const mobileRegex = /^[0-9]{10}$/;
    if (mobile && !mobileRegex.test(mobile)) {
      return res.status(400).json({ success: false, message: 'Invalid mobile number format' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      // Basic check, though usually handled by frontend or mongoose
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    console.log("--- ADD TENANT DEBUG ---");
    console.log("Body:", JSON.stringify(req.body, null, 2));

    // 1. Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      console.log(`📧 Found existing user with email: ${email}, user_id: ${user._id}`);

      // Check if this user has an active tenant profile
      const existingTenant = await Tenant.findOne({ user_id: user._id });

      if (existingTenant) {
        console.log(`❌ User has active tenant profile: ${existingTenant._id}`);
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists as an active tenant'
        });
      } else {
        // Orphaned user account (tenant was deleted but user wasn't) - clean it up
        console.log(`⚠️ ORPHANED ACCOUNT DETECTED: ${email} (user_id: ${user._id})`);
        console.log(`🧹 Cleaning up orphaned user account...`);

        try {
          const deletedUser = await User.findByIdAndDelete(user._id);
          if (deletedUser) {
            console.log(`✅ Successfully deleted orphaned user: ${email}`);
          } else {
            console.warn(`⚠️ User not found during deletion: ${user._id}`);
          }
        } catch (deleteError) {
          console.error(`❌ Error deleting orphaned user:`, deleteError);
          // Continue anyway - try to create new user
        }

        user = null; // Allow creation to proceed
        console.log(`✅ Orphaned account cleanup complete. Proceeding with new tenant creation.`);
      }
    } else {
      console.log(`✅ No existing user found with email: ${email}. Proceeding with creation.`);
    }


    // 0. Verify Room belongs to this PG
    if (!room_id) {
      return res.status(400).json({ success: false, message: 'Room ID is missing' });
    }

    const room = await Room.findOne({ _id: room_id, pg_id: req.user.pg_id });
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found or does not belong to your PG' });
    }

    // Check Capacity
    const existingTenantsCount = await Tenant.countDocuments({ room_id: room._id, status: { $ne: 'inactive' } });
    if (existingTenantsCount >= room.capacity) {
      return res.status(400).json({ success: false, message: `Room ${room.number} is full (Capacity: ${room.capacity})` });
    }

    // --- SUBSCRIPTION CHECK ---
    const pg = await PG.findById(req.user.pg_id);
    const currentPlan = pg.subscription.plan || 'Free';
    const planLimit = PLAN_LIMITS[currentPlan] ? PLAN_LIMITS[currentPlan].maxTenants : 5;

    // Count ALL active tenants in the PG
    const totalPgTenants = await Tenant.countDocuments({ pg_id: req.user.pg_id, status: { $ne: 'inactive' } });

    if (totalPgTenants >= planLimit) {
      return res.status(403).json({
        success: false,
        message: `Plan Limit Reached! Your ${currentPlan} plan allows max ${planLimit} tenants. Please upgrade to add more.`
      });
    }
    // --------------------------

    // Prepare Data
    const preferredLanguage = req.body.preferredLanguage || 'en';
    const placeholderPassword = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10);

    // --- TRANSACTION START ---
    const { withTransaction } = require('../utils/transaction');
    let tenant; // Will hold the created tenant

    await withTransaction(async (session) => {
      // 1. Create User
      const users = await User.create([{
        name,
        email,
        password: placeholderPassword,
        role: 'tenant',
        pg_id: req.user.pg_id,
        accountStatus: 'PENDING_ACTIVATION',
        preferredLanguage,
        created_by: req.user._id
      }], { session });
      user = users[0];

      // Analytics 1
      await OnboardingAnalytics.create([{
        pg_id: req.user.pg_id,
        tenant_id: user._id,
        step: 'CREATED',
        meta: { email, source: 'add_tenant' }
      }], { session });

      // Analytics 2
      await OnboardingAnalytics.create([{
        pg_id: req.user.pg_id,
        tenant_id: user._id,
        step: 'EMAIL_SENT',
        meta: { email, source: 'add_tenant' }
      }], { session });

      // 2. Create Tenant Profile
      const tenants = await Tenant.create([{
        user_id: user._id,
        pg_id: req.user.pg_id,
        room_id: room_id,
        rentAmount,
        advanceAmount: req.body.advanceAmount || 0,
        idProofFrontPath: (req.files && req.files['idProofFront']) ? req.files['idProofFront'][0].path : null,
        idProofBackPath: (req.files && req.files['idProofBack']) ? req.files['idProofBack'][0].path : null,
        contact_number: mobile,
        moveInDate: req.body.moveInDate || Date.now(),
        deposit,
        preferences: {
          sleepSchedule: req.body.sleepSchedule || 'FLEXIBLE',
          diet: req.body.diet || 'ANY',
          profession: req.body.profession || 'OTHER',
          cleanliness: parseInt(req.body.cleanliness) || 3,
          noiseTolerance: req.body.noiseTolerance || 'MEDIUM'
        }
      }], { session });
      tenant = tenants[0];

      // 3. Update Room Occupancy
      await Room.findByIdAndUpdate(room_id, { $inc: { occupied: 1 } }, { session });
    });
    // --- TRANSACTION END ---

    // Post-Transaction Actions (Emails)
    let emailSent = false;
    try {
      const activationToken = await tokenService.createActivationToken(user);
      const pg = await PG.findById(req.user.pg_id);
      const commResults = await communicationService.sendOnboardingCommunication(user, pg, activationToken, 'WELCOME');
      emailSent = commResults.email;
    } catch (e) { console.error("Post-Transaction Email Error", e); }

    // Re-fetch tenant for response to populate fields
    const finalTenant = await Tenant.findById(tenant._id)
      .populate('user_id', 'name email')
      .populate('room_id', 'number');

    // Audit Log (Async)
    const { logAction } = require('../services/audit.service');
    logAction(req, 'ADD_TENANT', 'Tenant', finalTenant._id, { email: user.email, room: room.number });

    res.status(201).json({
      success: true,
      data: finalTenant,
      user: { name, email },
      emailSent: emailSent,
      warning: emailSent ? null : "Tenant created but Email failed. Please use 'Resend Credentials' button."
    });

  } catch (error) {
    console.error("Add Tenant Error:", error);
    next(error);
  }
};

// @desc    Update tenant details
// @route   PUT /api/owner/tenants/:id
// @access  Private (Owner)
exports.updateTenant = async (req, res) => {
  try {
    const { name, email, mobile, room_id, rentAmount, advanceAmount, deposit, password } = req.body;

    let tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    if (tenant.pg_id.toString() !== req.user.pg_id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    // Update User details if provided
    if (name || email || mobile || password) {
      const updateFields = {};
      if (name) updateFields.name = name;
      if (email) updateFields.email = email;

      // Password update (only if strictly needed, usually separate flow, but allowed here for admin convenience)
      if (password && password.trim() !== '') {
        const salt = await bcrypt.genSalt(10);
        updateFields.password = await bcrypt.hash(password, salt);
      }

      await User.findByIdAndUpdate(tenant.user_id, updateFields);
    }

    // Update Tenant details
    if (room_id && room_id !== tenant.room_id.toString()) {
      const newRoom = await Room.findOne({ _id: room_id, pg_id: req.user.pg_id });
      if (!newRoom) return res.status(404).json({ success: false, message: 'New room not found' });

      const count = await Tenant.countDocuments({ room_id: newRoom._id, status: { $ne: 'inactive' } });
      if (count >= newRoom.capacity) {
        return res.status(400).json({ success: false, message: `Room ${newRoom.number} is full` });
      }
      
      // Sync Occupancy: Decrement old room, Increment new room
      await Room.findByIdAndUpdate(tenant.room_id, { $inc: { occupied: -1 } });
      await Room.findByIdAndUpdate(newRoom._id, { $inc: { occupied: 1 } });
      
      tenant.room_id = room_id;
    }
    // BUG-015 FIX: Use !== undefined instead of falsy check (0 is a valid value)
    if (rentAmount !== undefined && rentAmount !== null) tenant.rentAmount = rentAmount;
    if (advanceAmount !== undefined && advanceAmount !== null) tenant.advanceAmount = advanceAmount;
    if (deposit !== undefined && deposit !== null) tenant.deposit = deposit;
    if (mobile) tenant.contact_number = mobile;
    if (req.body.moveInDate) tenant.moveInDate = req.body.moveInDate;

    // Update preferences if provided
    if (!tenant.preferences) {
      tenant.preferences = {};
    }
    if (req.body.sleepSchedule) tenant.preferences.sleepSchedule = req.body.sleepSchedule;
    if (req.body.diet) tenant.preferences.diet = req.body.diet;
    if (req.body.profession) tenant.preferences.profession = req.body.profession;
    if (req.body.cleanliness !== undefined && req.body.cleanliness !== null) tenant.preferences.cleanliness = parseInt(req.body.cleanliness);
    if (req.body.noiseTolerance) tenant.preferences.noiseTolerance = req.body.noiseTolerance;

    await tenant.save();

    // Re-populate for response
    const updatedTenant = await Tenant.findById(tenant._id)
      .populate('user_id', 'name email')
      .populate('room_id', 'number');

    res.status(200).json({ success: true, data: updatedTenant });
  } catch (error) {
    console.error("Update Tenant Error:", error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Delete a tenant
// @route   DELETE /api/owner/tenants/:id
// @access  Private (Owner)
exports.deleteTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);

    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    // Ensure tenant belongs to owner's PG
    if (tenant.pg_id.toString() !== req.user.pg_id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    // Store user_id before deletion
    const userId = tenant.user_id;

    // Delete Tenant Profile first
    await tenant.deleteOne();
    console.log(`✅ Tenant profile deleted: ${req.params.id}`);

    // Decrement Room Occupancy
    await Room.findByIdAndUpdate(tenant.room_id, { $inc: { occupied: -1 } });

    // Delete associated User account
    if (userId) {
      const deletedUser = await User.findByIdAndDelete(userId);
      if (deletedUser) {
        console.log(`✅ User account deleted: ${userId} (${deletedUser.email})`);
      } else {
        console.warn(`⚠️ User account not found for deletion: ${userId}`);
      }
    }

    res.status(200).json({ success: true, message: 'Tenant deleted successfully' });
  } catch (error) {
    console.error("Delete Tenant Error:", error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Get all complaints for the PG
// @route   GET /api/owner/complaints
// @access  Private (Owner)
exports.getComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ pg_id: req.user.pg_id })
      .populate({
        path: 'tenant_id',
        populate: {
          path: 'user_id',
          select: 'name'
        }
      })
      .populate({
        path: 'tenant_id',
        populate: {
          path: 'room_id',
          select: 'number' // changed from room-number to number as per schema
        }
      })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: complaints.length, data: complaints });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update complaint status
// @route   PUT /api/owner/complaints/:id
// @access  Private (Owner)
exports.updateComplaintStatus = async (req, res) => {
  try {
    const { status, adminComment } = req.body;

    let complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    if (complaint.pg_id.toString() !== req.user.pg_id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    complaint = await Complaint.findByIdAndUpdate(req.params.id, { status, adminComment }, { new: true });

    // Real-Time Notification
    // BUG-012 FIX: complaint.tenant_id is a raw ObjectId (not populated), so .user_id is undefined
    // Emit to the tenant_id directly — the tenant joins a room named after their Tenant ObjectId
    try {
      const { getIO } = require('../services/socket.service');
      getIO().to(`user_${complaint.tenant_id}`).emit('COMPLAINT_UPDATED', complaint);
    } catch (socketError) {
      console.error('Socket Emission Error:', socketError.message);
    }

    res.status(200).json({ success: true, data: complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Create a new notice
// @route   POST /api/owner/notices
// @access  Private (Owner)
exports.createNotice = async (req, res) => {
  try {
    const { title, message, type } = req.body;

    const notice = await Notice.create({
      pg_id: req.user.pg_id,
      title,
      message,
      type
    });

    // 🟢 Emit Real-Time Socket Event to all Tenants in the PG
    try {
      const { getIO } = require('../services/socket.service');
      getIO().to(`pg_${req.user.pg_id}`).emit('NEW_NOTICE', notice);
    } catch (socketError) {
      console.error('Socket Emission Error:', socketError.message);
    }

    res.status(201).json({ success: true, data: notice });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get all notices for the PG
// @route   GET /api/owner/notices
// @access  Private (Owner)
exports.getNotices = async (req, res) => {
  try {
    const notices = await Notice.find({ pg_id: req.user.pg_id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: notices.length, data: notices });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Delete a notice
// @route   DELETE /api/owner/notices/:id
// @access  Private (Owner)
exports.deleteNotice = async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);

    if (!notice) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }

    if (notice.pg_id.toString() !== req.user.pg_id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    await notice.deleteOne();

    res.status(200).json({ success: true, message: 'Notice deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Add a new expense
// @route   POST /api/owner/expenses
// @access  Private (Owner)
exports.addExpense = asyncHandler(async (req, res) => {
    const { amount, category, description, date } = req.body;

    const expense = await Expense.create({
      pg_id: req.user.pg_id,
      amount,
      category,
      description,
      date: date || Date.now()
    });

    res.status(201).json({ success: true, data: expense });
});

// @desc    Get all expenses
// @route   GET /api/owner/expenses
// @access  Private (Owner)
exports.getExpenses = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 0;
    const skip = (page - 1) * limit;

    let query = Expense.find({ pg_id: req.user.pg_id }).sort({ date: -1 }).lean();

    if (limit > 0) {
        query = query.skip(skip).limit(limit);
    }

    const expenses = await query;
    const total = limit > 0 ? await Expense.countDocuments({ pg_id: req.user.pg_id }) : expenses.length;

    res.status(200).json({ 
        success: true, 
        count: expenses.length, 
        pagination: limit > 0 ? { page, limit, totalPages: Math.ceil(total / limit), total } : null,
        data: expenses 
    });
});

// @desc    Delete expense
// @route   DELETE /api/owner/expenses/:id
// @access  Private (Owner)
exports.deleteExpense = asyncHandler(async (req, res) => {
    const { ApiError } = require('../middlewares/error.middleware');
    const expense = await Expense.findById(req.params.id);
    if (!expense) throw new ApiError(404, 'Expense not found');
    if (expense.pg_id.toString() !== req.user.pg_id.toString()) throw new ApiError(403, 'Not authorized');

    await expense.deleteOne();
    res.status(200).json({ success: true, message: 'Expense deleted' });
});

// @desc    Get Financial Analytics
// @route   GET /api/owner/analytics
// @access  Private (Owner)
// @desc    Get All Payments (History)
// @route   GET /api/owner/payments
// @access  Owner
exports.getPayments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const total = await Payment.countDocuments({ pg_id: req.user.pg_id });
    
    const payments = await Payment.find({ pg_id: req.user.pg_id })
      .populate({
        path: 'tenant_id',
        populate: { path: 'user_id', select: 'name email' }
      })
      .sort({ transaction_date: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({ 
      success: true, 
      count: payments.length,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      data: payments 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    // BUG-027 FIX: Cast pgId to ObjectId for aggregation $match (Redis returns strings)
    const pgId = new mongoose.Types.ObjectId(req.user.pg_id);

    // 1 & 2. Calculate Total Expenses and Revenue in parallel
    const [expenses, revenue] = await Promise.all([
      Expense.aggregate([
        { $match: { pg_id: pgId } },
        { $group: { _id: '$category', total: { $sum: '$amount' } } }
      ]),
      Payment.aggregate([
        { $match: { pg_id: pgId, status: 'SUCCESS' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    const totalRevenue = revenue.length > 0 ? revenue[0].total : 0;
    const totalExpenses = expenses.reduce((acc, curr) => acc + curr.total, 0);
    const profit = totalRevenue - totalExpenses;

    res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        totalExpenses,
        profit,
        expenseBreakdown: expenses
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Export Financial Report (CSV)
// @route   GET /api/owner/analytics/export
// @access  Private (Owner)
exports.exportFinancials = async (req, res) => {
  try {
    const pgId = req.user.pg_id;
    const { format } = req.query; // 'csv'

    // --- SUBSCRIPTION CHECK ---
    const pg = await PG.findById(pgId);
    const currentPlan = pg.subscription.plan || 'Free';
    const allowedFeatures = PLAN_LIMITS[currentPlan] ? PLAN_LIMITS[currentPlan].features : [];

    if (!allowedFeatures.includes('Data Export (CSV)')) {
      return res.status(403).json({
        success: false,
        message: `Feature Locked! Data Export is available on Pro plan and above. Current Plan: ${currentPlan}`
      });
    }
    // --------------------------

    // 1. Fetch Data
    // BUG-014 FIX: Populate tenant name for readable CSV export
    const payments = await Payment.find({ pg_id: pgId, status: 'SUCCESS' })
      .sort({ transaction_date: -1 })
      .populate({ path: 'tenant_id', populate: { path: 'user_id', select: 'name email' } });
    const expenses = await Expense.find({ pg_id: pgId }).sort({ date: -1 });

    // 2. Combine & Sort
    const reportData = [];

    payments.forEach(p => {
      const tenantName = p.tenant_id?.user_id?.name || 'Unknown Tenant';
      reportData.push({
        date: p.transaction_date,
        type: 'INCOME',
        category: 'Rent',
        amount: p.amount,
        description: `Rent from ${tenantName}`
      });
    });

    expenses.forEach(e => {
      reportData.push({
        date: e.date,
        type: 'EXPENSE',
        category: e.category,
        amount: -e.amount, // Negative for expense
        description: e.description
      });
    });

    // Sort by Date Descending
    reportData.sort((a, b) => new Date(b.date) - new Date(a.date));

    // 3. Generate CSV
    if (format === 'csv' || true) {
      let csv = 'Date,Type,Category,Amount,Description\n';
      reportData.forEach(row => {
        const dateStr = new Date(row.date).toLocaleDateString();
        // Escape content
        const desc = `"${row.description.replace(/"/g, '""')}"`;
        csv += `${dateStr},${row.type},${row.category},${row.amount},${desc}\n`;
      });

      res.header('Content-Type', 'text/csv');
      res.attachment(`financial_report_${new Date().toISOString().slice(0, 10)}.csv`);
      return res.send(csv);
    }
  } catch (error) {
    console.error("Export Error:", error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
/**
 * @desc    Get Dashboard Statistics
 * @route   GET /api/owner/dashboard-stats
 * @access  Private (Owner)
 * @description
 * Calculates high-level metrics for the owner dashboard using efficient MongoDB Aggregations.
 * Metrics include:
 * - Active Tenants & Total Expected Rent
 * - Rent Collected vs Pending (Current Month)
 * - Occupancy Rate
 * - Open Complaints
 * 
 * Optimization: Uses Aggregation Pipeline ($group, $sum) to avoid fetching all documents into memory.
 */
exports.getDashboardStats = async (req, res) => {
  try {
    // BUG-027 FIX: Cast pgId to ObjectId for aggregation $match
    const pgId = new mongoose.Types.ObjectId(req.user.pg_id);
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    // Run independent database operations in parallel to optimize response time
    const [tenantStats, payments, openComplaints, roomStats] = await Promise.all([
      // 1. Get Active Tenants count and Total Expected Rent
      Tenant.aggregate([
        { $match: { pg_id: pgId, status: { $ne: 'inactive' } } },
        { $group: { _id: null, count: { $sum: 1 }, totalRent: { $sum: '$rentAmount' } } }
      ]),
      // 2. Get Rent Collected This Month
      Payment.aggregate([
        {
          $match: {
            pg_id: pgId,
            type: 'RENT',
            status: 'SUCCESS',
            transaction_date: { $gte: startOfMonth, $lt: endOfMonth }
          }
        },
        { $group: { _id: null, totalCollected: { $sum: '$amount' } } }
      ]),
      // 3. Get Open Complaints Count
      Complaint.countDocuments({
        pg_id: pgId,
        status: { $in: ['open', 'pending'] }
      }),
      // 4. Get Occupancy
      Room.aggregate([
        { $match: { pg_id: pgId } },
        { $group: { _id: null, totalCapacity: { $sum: '$capacity' } } }
      ])
    ]);

    const totalTenants = tenantStats.length > 0 ? tenantStats[0].count : 0;
    const expectedRent = tenantStats.length > 0 ? tenantStats[0].totalRent : 0;
    const collectedRent = payments.length > 0 ? payments[0].totalCollected : 0;
    const pendingRent = Math.max(0, expectedRent - collectedRent);
    const totalCapacity = roomStats.length > 0 ? roomStats[0].totalCapacity : 0;
    const occupancy = totalCapacity > 0 ? Math.round((totalTenants / totalCapacity) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        tenants: totalTenants,
        occupancy,
        pendingRent,
        complaints: openComplaints
      }
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Resend Tenant Credentials (Resets Password)
// @route   POST /api/owner/tenants/:id/resend-credentials
// @access  Private (Owner)
exports.resendOwnerTenantCredentials = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id).populate('user_id');
    if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });
    if (tenant.pg_id.toString() !== req.user.pg_id.toString()) return res.status(401).json({ success: false, message: 'Not authorized' });

    const user = await User.findById(tenant.user_id._id);
    if (!user) return res.status(404).json({ success: false, message: 'User record not found' });

    // Generate NEW Token (via Service)
    const activationToken = await tokenService.createActivationToken(user);

    user.accountStatus = 'PENDING_ACTIVATION';
    await user.save();

    // Log Analytics: Resend
    await OnboardingAnalytics.create({
      pg_id: req.user.pg_id,
      tenant_id: user._id,
      step: 'EMAIL_SENT',
      meta: { email: user.email, source: 'resend_credentials' }
    });

    // Send Communication
    const pg = await PG.findById(req.user.pg_id);
    const commResults = await communicationService.sendOnboardingCommunication(user, pg, activationToken, 'WELCOME');

    if (commResults.email || commResults.whatsapp) {
      res.json({ success: true, message: 'Credentials resent successfully' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to send communication' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Bulk Add Tenants via CSV
// @route   POST /api/owner/tenants/bulk
// @access  Private (Owner)
exports.bulkAddTenants = async (req, res) => {
  const { parseCsv } = require('../utils/csvParser');

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please upload a CSV file' });
  }

  try {
    const rows = await parseCsv(req.file.path);
    const results = { success: 0, failed: 0, errors: [] };

    for (const [index, row] of rows.entries()) {
      try {
        // Minimal Validation
        if (!row.email || !row.name || !row.roomNumber || !row.rentAmount) {
          throw new Error('Missing required fields (email, name, roomNumber, rentAmount)');
        }

        // 1. Find Room
        const room = await Room.findOne({ pg_id: req.user.pg_id, number: row.roomNumber });
        if (!room) throw new Error(`Room ${row.roomNumber} not found`);

        // 2. Check User Existence
        const existingUser = await User.findOne({ email: row.email });
        if (existingUser) throw new Error(`User with email ${row.email} already exists`);

        // 3. Create User
        const password = await bcrypt.hash(crypto.randomBytes(8).toString('hex'), 10);
        const user = await User.create({
          name: row.name,
          email: row.email,
          password,
          role: 'tenant',
          pg_id: req.user.pg_id,
          accountStatus: 'PENDING_ACTIVATION',
          created_by: req.user._id
        });

        // 4. Create Token for activation link
        const token = await tokenService.createActivationToken(user);

        // 5. Create Tenant Profile
        await Tenant.create({
          user_id: user._id,
          pg_id: req.user.pg_id,
          room_id: room._id,
          rentAmount: row.rentAmount,
          contact_number: row.mobile || '',
          deposit: row.deposit || 0
        });

        // 6. Send Email (Async)
        const pg = await PG.findById(req.user.pg_id);
        communicationService.sendOnboardingCommunication(user, pg, token, 'WELCOME');

        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push(`Row ${index + 1} (${row.email || 'unknown'}): ${err.message}`);
      }
    }

    // Cleanup File
    const fs = require('fs');
    fs.unlinkSync(req.file.path);

    res.json({ success: true, results });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// @desc    Manage Exit Request (Approve/Reject)
// @route   POST /api/owner/tenants/exit-request
// @access  Private (Owner)
exports.manageExitRequest = async (req, res) => {
  try {
    const { tenantId, status, comment, exitDate } = req.body; // status: APPROVED or REJECTED

    const tenant = await Tenant.findOne({ _id: tenantId, pg_id: req.user.pg_id });

    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    if (!tenant.exit_request || tenant.exit_request.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'No pending exit request found' });
    }

    tenant.exit_request.status = status;
    tenant.exit_request.admin_comment = comment;

    if (status === 'APPROVED') {
      tenant.exit_date = exitDate || tenant.exit_request.requested_date;
      tenant.status = 'on_notice';
    }

    await tenant.save();

    res.json({ success: true, message: `Exit request ${status.toLowerCase()}`, data: tenant });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Confirm Tenant Exit (Mark as exited & free room)
// @route   POST /api/owner/tenants/:id/confirm-exit
// @access  Private (Owner)
exports.confirmTenantExit = async (req, res) => {
  try {
    const tenant = await Tenant.findOne({ _id: req.params.id, pg_id: req.user.pg_id });

    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    if (tenant.status === 'exited') {
      return res.status(400).json({ success: false, message: 'Tenant has already exited' });
    }

    // Update Tenant Status
    tenant.status = 'exited';
    await tenant.save();

    // Decrement Room Occupancy
    await Room.findByIdAndUpdate(tenant.room_id, { $inc: { occupied: -1 } });

    res.json({ success: true, message: 'Tenant exit confirmed. Room occupancy updated.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Clean up orphaned user accounts (users without tenant profiles)
// @route   POST /api/owner/cleanup-orphaned-accounts
// @access  Private (Owner)
exports.cleanupOrphanedAccounts = async (req, res) => {
  try {
    console.log('🧹 Starting orphaned account cleanup...');

    // Find all users with role 'tenant' for this PG
    const allTenantUsers = await User.find({
      role: 'tenant',
      pg_id: req.user.pg_id
    });

    console.log(`📊 Found ${allTenantUsers.length} tenant users for PG: ${req.user.pg_id}`);

    const orphanedAccounts = [];

    for (const user of allTenantUsers) {
      // Check if this user has a tenant profile
      const tenantProfile = await Tenant.findOne({ user_id: user._id });

      if (!tenantProfile) {
        orphanedAccounts.push({
          user_id: user._id,
          email: user.email,
          name: user.name
        });
      }
    }

    console.log(`⚠️ Found ${orphanedAccounts.length} orphaned accounts`);

    if (orphanedAccounts.length === 0) {
      return res.json({
        success: true,
        message: 'No orphaned accounts found',
        data: { cleaned: 0, orphaned: [] }
      });
    }

    // Delete orphaned accounts
    const deletePromises = orphanedAccounts.map(account =>
      User.findByIdAndDelete(account.user_id)
    );

    await Promise.all(deletePromises);

    console.log(`✅ Cleaned up ${orphanedAccounts.length} orphaned accounts`);

    res.json({
      success: true,
      message: `Successfully cleaned up ${orphanedAccounts.length} orphaned account(s)`,
      data: {
        cleaned: orphanedAccounts.length,
        orphaned: orphanedAccounts
      }
    });
  } catch (error) {
    console.error('❌ Cleanup error:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Request Async Financial Report (BullMQ)
// @route   POST /api/owner/analytics/export/async
// @access  Private (Owner)
exports.requestFinancialReportAsync = async (req, res) => {
  try {
    const pgId = req.user.pg_id;
    const email = req.user.email;
    const { format } = req.query; // 'csv' or 'pdf'

    // Need to verify subscription allows this?
    // Let's assume it's protected by route middleware (checkSubscription)
    const { requestFinancialReport } = require('../workers/report.worker');
    
    await requestFinancialReport(pgId, email, format || 'csv');

    res.status(202).json({
      success: true,
      message: 'Financial report generation started. You will receive an email shortly.'
    });
  } catch (error) {
    console.error('❌ Async Report Request Error:', error);
    res.status(500).json({ success: false, message: 'Failed to request report', error: error.message });
  }
};

// @desc    Evaluate Roommate Compatibility for Onboarding/Editing
// @route   POST /api/owner/rooms/:id/compatibility
// @access  Private (Owner)
exports.checkRoommateCompatibility = async (req, res) => {
  try {
    const roomId = req.params.id;
    const proposedPreferences = {
      sleepSchedule: req.body.sleepSchedule || 'FLEXIBLE',
      diet: req.body.diet || 'ANY',
      profession: req.body.profession || 'OTHER',
      cleanliness: parseInt(req.body.cleanliness) || 3,
      noiseTolerance: req.body.noiseTolerance || 'MEDIUM'
    };

    // Find all active roommates currently in this room
    const currentRoommates = await Tenant.find({
      room_id: roomId,
      status: 'active'
    }).populate('user_id', 'name email');

    // If no occupants are in this room yet, it's 100% compatible (First resident)
    if (currentRoommates.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          compatibilityScore: 100,
          clashes: [],
          matches: ["First occupant: Room is completely vacant!"],
          roommatesCount: 0
        }
      });
    }

    let totalScore = 0;
    const clashes = [];
    const matches = [];

    // Compare proposed tenant against every existing roommate, then average the scores
    currentRoommates.forEach(roommate => {
      let score = 100;
      const rPref = roommate.preferences || {
        sleepSchedule: 'FLEXIBLE',
        diet: 'ANY',
        profession: 'OTHER',
        cleanliness: 3,
        noiseTolerance: 'MEDIUM'
      };

      const name = roommate.user_id?.name || 'Current Resident';

      // 1. Sleep Schedule
      if (proposedPreferences.sleepSchedule === rPref.sleepSchedule) {
        matches.push(`Sleep schedule aligns with ${name} (${proposedPreferences.sleepSchedule.replace('_', ' ')})`);
      } else if (
        (proposedPreferences.sleepSchedule === 'EARLY_BIRD' && rPref.sleepSchedule === 'NIGHT_OWL') ||
        (proposedPreferences.sleepSchedule === 'NIGHT_OWL' && rPref.sleepSchedule === 'EARLY_BIRD')
      ) {
        score -= 20; // severe clash
        clashes.push(`Schedule conflict with ${name}: Early Bird vs. Night Owl`);
      } else {
        score -= 5;
      }

      // 2. Diet
      if (proposedPreferences.diet === rPref.diet || proposedPreferences.diet === 'ANY' || rPref.diet === 'ANY') {
        matches.push(`Dietary choices are compatible with ${name}`);
      } else if (proposedPreferences.diet === 'VEG' && rPref.diet === 'NON_VEG') {
        score -= 15;
        clashes.push(`Dietary mismatch with ${name}: Strict Vegetarian vs. Non-Vegetarian`);
      } else if (proposedPreferences.diet === 'NON_VEG' && rPref.diet === 'VEG') {
        score -= 15;
        clashes.push(`Dietary mismatch with ${name}: Non-Vegetarian vs. Strict Vegetarian`);
      }

      // 3. Cleanliness
      const diffClean = Math.abs(proposedPreferences.cleanliness - rPref.cleanliness);
      if (diffClean === 0) {
        matches.push(`Cleanliness habits align with ${name}`);
      } else if (diffClean >= 3) {
        score -= 20;
        clashes.push(`Cleanliness conflict with ${name}: Extremely neat vs. relaxed habits`);
      } else {
        score -= diffClean * 5;
      }

      // 4. Noise Tolerance
      if (proposedPreferences.noiseTolerance === rPref.noiseTolerance) {
        matches.push(`Noise tolerance levels match with ${name}`);
      } else if (
        (proposedPreferences.noiseTolerance === 'LOW' && rPref.noiseTolerance === 'HIGH') ||
        (proposedPreferences.noiseTolerance === 'HIGH' && rPref.noiseTolerance === 'LOW')
      ) {
        score -= 20;
        clashes.push(`Noise preference clash with ${name}: High sensitivity vs. quiet requirement`);
      } else {
        score -= 8;
      }

      // 5. Profession
      if (proposedPreferences.profession === rPref.profession && proposedPreferences.profession !== 'OTHER') {
        matches.push(`Both are ${proposedPreferences.profession.toLowerCase()}s`);
      } else if (proposedPreferences.profession !== rPref.profession) {
        score -= 5;
      }

      totalScore += score;
    });

    const avgScore = Math.max(0, Math.min(100, Math.round(totalScore / currentRoommates.length)));
    const uniqueMatches = [...new Set(matches)];
    const uniqueClashes = [...new Set(clashes)];

    res.status(200).json({
      success: true,
      data: {
        compatibilityScore: avgScore,
        clashes: uniqueClashes,
        matches: uniqueMatches,
        roommatesCount: currentRoommates.length
      }
    });
  } catch (error) {
    console.error("Roommate Compatibility Evaluation Error:", error);
    res.status(500).json({ success: false, message: 'Compatibility evaluation failed' });
  }
};

