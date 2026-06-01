const express = require('express');
const { register, login, logout, getMe, forgotPassword, resetPassword, changePassword, setupAccount } = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { strictRateLimiter } = require('../middlewares/rateLimit.middleware');
const { registerSchema, loginSchema } = require('../utils/validators');

const router = express.Router();

router.post('/register', strictRateLimiter, validate(registerSchema), register);
router.post('/login', strictRateLimiter, validate(loginSchema), login);
router.post('/logout', protect, logout);
router.post('/forgot-password', strictRateLimiter, forgotPassword);
router.post('/reset-password', strictRateLimiter, resetPassword);
router.post('/setup-account', setupAccount);
router.put('/change-password', protect, changePassword);
router.get('/me', protect, getMe);

module.exports = router;
