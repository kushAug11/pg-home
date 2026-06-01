const express = require('express');
const { protect, authorize } = require('../middlewares/auth.middleware');
const { getPlatformStats, getAllPGs, deletePG } = require('../controllers/admin.controller');

const router = express.Router();

// All routes are protected and restricted to Admin
router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getPlatformStats);
router.get('/pgs', getAllPGs);
router.delete('/pgs/:id', deletePG);

router.get('/audit-logs', require('../controllers/admin.controller').getAuditLogs);

// Backup Routes
router.route('/backups')
    .post(require('../controllers/admin.controller').triggerBackup)
    .get(require('../controllers/admin.controller').getBackups);

router.get('/backups/:filename', require('../controllers/admin.controller').downloadBackup);

// Support Tools
router.get('/support/user', require('../controllers/admin.controller').getUserDetails);

module.exports = router;

