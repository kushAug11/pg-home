const express = require('express');
const { protect, authorize } = require('../middlewares/auth.middleware');
const { createOrder, verifyPayment, recordManualPayment } = require('../controllers/payment.controller');
const { handleWebhook } = require('../controllers/webhook.controller');
const validate = require('../middlewares/validate.middleware');
const { createPaymentOrderSchema } = require('../utils/validators');

const router = express.Router();

router.post('/webhook', handleWebhook); // Public, signature verified inside

// Protected Routes
router.use(protect);
router.post('/order', validate(createPaymentOrderSchema), createOrder);
router.post('/verify', verifyPayment);
router.post('/manual', authorize('owner', 'admin'), recordManualPayment);


module.exports = router;
