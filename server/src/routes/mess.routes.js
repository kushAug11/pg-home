const express = require('express');
const router = express.Router();
const MessController = require('../controllers/MessController');
const { protect, authorize } = require('../middlewares/auth.middleware');

// Owner: Update Menu, View Analytics
router.post('/menu', protect, authorize('owner'), MessController.updateMenu);
router.get('/analytics', protect, authorize('owner'), MessController.getMessAnalytics);

// Public/Tenant: View Menu
router.get('/menu', protect, MessController.getMenu);

// Tenant: Mark Attendance
router.post('/attendance', protect, MessController.markAttendance);

// --- Meal Voucher Routes ---
// Tenants purchase and view their vouchers
router.post('/vouchers', protect, MessController.purchaseVoucher);
router.get('/vouchers/my', protect, MessController.getMyVouchers);

// Owners view and verify vouchers
router.get('/vouchers', protect, authorize('owner'), MessController.getVouchersList);
router.post('/vouchers/verify', protect, authorize('owner'), MessController.verifyVoucher);

module.exports = router;
