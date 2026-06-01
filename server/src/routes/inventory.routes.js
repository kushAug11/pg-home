const express = require('express');
const router = express.Router();
const InventoryController = require('../controllers/InventoryController');
const { protect, authorize } = require('../middlewares/auth.middleware');

router.get('/', protect, authorize('owner'), InventoryController.getItems);
router.post('/', protect, authorize('owner'), InventoryController.addItem);
router.post('/assign', protect, authorize('owner'), InventoryController.assignItem);
router.post('/return', protect, authorize('owner'), InventoryController.returnItem);

module.exports = router;
