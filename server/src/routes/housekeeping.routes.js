const express = require('express');
const router = express.Router();
const HousekeepingController = require('../controllers/HousekeepingController');
const { protect, authorize } = require('../middlewares/auth.middleware');

router.get('/daily', protect, authorize('owner'), HousekeepingController.getDailyStatus);
router.post('/log', protect, authorize('owner'), HousekeepingController.logCleaning);

module.exports = router;
