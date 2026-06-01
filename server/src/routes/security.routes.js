const express = require('express');
const router = express.Router();
const SecurityController = require('../controllers/SecurityController');
const { protect, authorize } = require('../middlewares/auth.middleware');

// --- Visitor Routes (Owner/Admin) ---
// Ideally "Security" role, but Owner/Admin for now
router.post('/visitors', protect, authorize('owner', 'admin'), SecurityController.logVisitorEntry);
router.get('/visitors/active', protect, authorize('owner', 'admin'), SecurityController.getActiveVisitors);
router.put('/visitors/:id/exit', protect, authorize('owner', 'admin'), SecurityController.markVisitorExit);

// --- Guest Request Routes ---

// Tenant
router.post('/guests', protect, authorize('tenant'), SecurityController.createGuestRequest);
router.get('/guests/my', protect, authorize('tenant'), SecurityController.getMyGuestRequests);

// Owner
router.get('/guests/pending', protect, authorize('owner'), SecurityController.getPendingGuestRequests);
router.put('/guests/:id/status', protect, authorize('owner'), SecurityController.updateGuestRequestStatus);

// Pre-Authorized Visitors (Owner/Admin)
router.get('/preauth-visitors', protect, authorize('owner', 'admin'), SecurityController.getPreAuthVisitorsList);
router.post('/preauth-visitors/check-in', protect, authorize('owner', 'admin'), SecurityController.checkInPreAuthVisitor);

module.exports = router;
