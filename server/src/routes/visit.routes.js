const express = require('express');
const router = express.Router();
const VisitController = require('../controllers/VisitController');
const { protect, authorize } = require('../middlewares/auth.middleware');

router.use(protect);
router.use(authorize('owner'));

router.get('/', VisitController.getVisitRequests);
router.put('/:id', VisitController.updateVisitStatus);

module.exports = router;
