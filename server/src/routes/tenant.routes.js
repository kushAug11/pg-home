const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');
const {
    getDashboard,
    initiateRentPayment,
    verifyPayment,
    getPayments,
    raiseComplaint,
    getComplaints,
    getNotices,
    requestExit,
    getPreAuthVisitors,
    createPreAuthVisitor
} = require('../controllers/tenant.controller');


const { enforceIsolation } = require('../middlewares/isolation.middleware');

// All routes are protected and for 'tenant' role only
router.use(protect);
router.use(authorize('tenant'));
router.use(enforceIsolation);

router.get('/dashboard', getDashboard);

// Payment Routes
router.get('/payments', getPayments);
router.post('/pay-rent', initiateRentPayment);
router.post('/verify-payment', verifyPayment);

// Complaint Routes
router.get('/complaints', getComplaints);
router.post('/complaints', raiseComplaint);

// Notice Routes
router.get('/notices', getNotices);
router.post('/request-exit', requestExit);

// Pre-Authorized Visitors
router.get('/preauth-visitors', getPreAuthVisitors);
router.post('/preauth-visitors', createPreAuthVisitor);

module.exports = router;
