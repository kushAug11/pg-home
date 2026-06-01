const User = require('../models/User');
const PG = require('../models/PG');
const { sendOTP } = require('../services/email.service');
const crypto = require('crypto');
const generateToken = require('../utils/generateToken');
const bcrypt = require('bcryptjs');
const OnboardingAnalytics = require('../models/OnboardingAnalytics');
const tokenService = require('../services/token.service');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 * @description
 * Registration entry point.
 * - Prevents identifying as 'admin' directly.
 * - Hashes password using bcrypt.
 * - If role is 'owner', automatically creates a linked PG record.
 * - Returns JWT token for immediate login.
 */
exports.register = async (req, res) => {
    try {
        const { name, email, password, role, pgName } = req.body;

        // SECURITY: Prevent creating admin via public route
        if (role === 'admin') {
            return res.status(403).json({ success: false, message: 'Cannot register as admin' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create User
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: role || 'tenant',
            accountStatus: 'ACTIVE' // Self-registered users are Active by default
        });

        // If Owner, create PG
        if (role === 'owner' && pgName) {
            const pg = await PG.create({
                name: pgName,
                owner_id: user._id,
                address: 'Please update address', // Placeholder
                city: 'Unknown'
            });

            // Update User with pg_id (Strict Linking)
            user.pg_id = pg._id;
            await user.save();
        }

        res.status(201).json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                pg_id: user.pg_id,
                token: generateToken(user),
            },
        });
    } catch (error) {
        console.error('❌ Register Error:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 * @description
 * Loign flow with security checks:
 * 1. Verifies credentials.
 * 2. Checks `accountStatus` (rejects PENDING/SUSPENDED).
 * 3. Logs login action to Audit trail.
 * 4. Returns JWT and user profile.
 */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        // Check Account Status
        // Check Account Status
        if (user.role === 'tenant' && user.accountStatus === 'PENDING_ACTIVATION') {
            return res.status(403).json({ success: false, message: 'Account not activated. Please check your email for the setup link.' });
        }
        if (user.accountStatus === 'SUSPENDED' || user.accountStatus === 'DEACTIVATED') {
            return res.status(403).json({ success: false, message: 'Account suspended or deactivated. Contact support.' });
        }

        if (await bcrypt.compare(password, user.password)) {
            res.json({
                success: true,
                data: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    pg_id: user.pg_id,
                    mustChangePassword: user.mustChangePassword,
                    token: generateToken(user),
                },
            });

            // Audit Log
            const { logAction } = require('../services/audit.service');
            logAction({ user, ip: req.ip }, 'USER_LOGIN', 'User', user._id, { role: user.role });
        } else {
            res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('❌ Login Error:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id || req.user.id).select('-password').populate('pg_id');
        res.json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Forgot Password (Send OTP)
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        // Validate email format
        if (!email || !email.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Email address is required'
            });
        }

        // Basic email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid email address'
            });
        }

        // Check if user exists in database
        const user = await User.findOne({ email: email.toLowerCase().trim() });

        // BUG-004 FIX: Always return same response regardless of user existence
        // Prevents attacker from enumerating valid email addresses
        if (!user) {
            console.log(`⚠️ Password reset attempted for non-existent email: ${email}`);
            return res.json({
                success: true,
                message: 'If this email is registered, you will receive an OTP shortly.'
            });
        }

        // Generate 6 digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Save OTP to user (valid for 10 mins)
        user.resetPasswordOtp = otp;
        user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
        await user.save();

        // BUG-003 FIX: Only log OTP in non-production environments
        if (process.env.NODE_ENV !== 'production') {
            console.log('==================================================');
            console.log(`🔐 PASSWORD RESET REQUEST for: ${email}`);
            console.log(`📧 OTP Generated: ${otp}`);
            console.log(`⏰ Valid until: ${new Date(user.resetPasswordExpires).toLocaleString()}`);
            console.log('==================================================');
        }

        // Send OTP via BullMQ Worker
        try {
            const { enqueueEmail } = require('../workers/email.worker');
            await enqueueEmail('sendOTP', { email: user.email, otp });

            console.log(`✅ OTP email enqueued for ${email}`);
        } catch (emailError) {
            console.error('❌ Email sending failed:', emailError.message);
            if (process.env.NODE_ENV !== 'production') {
                console.log(`⚠️ OTP for ${email}: ${otp} (Check server logs)`);
            }
        }

        // Always return generic success to prevent user enumeration
        res.json({
            success: true,
            message: 'If this email is registered, you will receive an OTP shortly.'
        });

    } catch (error) {
        console.error('❌ Forgot Password Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
    try {
        const { email, otp, password } = req.body;

        // Normalize inputs
        const normalizedEmail = email ? email.toLowerCase().trim() : '';
        const normalizedOtp = otp ? otp.toString().trim() : '';

        const user = await User.findOne({
            email: normalizedEmail,
            resetPasswordOtp: normalizedOtp,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        // Clear OTP
        user.resetPasswordOtp = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({ success: true, message: 'Password reset successful' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Setup Account (Magic Link Activation)
 * @route   POST /api/auth/setup-account
 * @access  Public (Token Based)
 * @description
 * Finalizes user account creation for invited tenants/owners.
 * - Validates time-sensitive activation token.
 * - Sets user password.
 * - Activates account status.
 * - Logs 'ACTIVATED' event to onboarding analytics.
 */
exports.setupAccount = async (req, res) => {
    try {
        const { token, password } = req.body;

        // 1. Validate Token (AuthToken Table)
        const userId = await tokenService.validateToken(token, 'ACTIVATION');

        if (!userId) {
            return res.status(400).json({ success: false, message: 'Invalid or expired setup link' });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        // Activate
        user.accountStatus = 'ACTIVE';
        user.mustChangePassword = false;
        // Old fields cleanup (optional)
        user.setupToken = undefined;
        user.setupTokenExpires = undefined;

        await user.save();

        // Log Analytics: Activated
        await OnboardingAnalytics.create({
            pg_id: user.pg_id,
            tenant_id: user._id,
            step: 'ACTIVATED',
            meta: { email: user.email }
        });

        res.json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                pg_id: user.pg_id,
                token: generateToken(user),
            },
            message: 'Account setup successful'
        });
    } catch (error) {
        console.error("Setup Account Error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Change Password (Authenticated)
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // If strict mode, verify old password (optional for first-time forced change?)
        // Best practice: Always verify old unless it's an admin override.
        // For "Force Change", the user knows the temp password (they logged in with it).

        if (currentPassword) {
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(401).json({ success: false, message: 'Incorrect current password' });
            }
        } else if (!user.mustChangePassword) {
            // If not a forced change, current password IS required
            return res.status(400).json({ success: false, message: 'Current password is required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        // Clear flag
        user.mustChangePassword = false;
        await user.save();

        // BUG-002 FIX: Invalidate Redis session cache so old tokens re-fetch from DB
        try {
            const redis = require('../config/redis');
            await redis.del(`session:${req.user.id || req.user._id}`);
        } catch (cacheError) {
            console.warn('Cache invalidation failed:', cacheError.message);
        }

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Logout user & invalidate token cache
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
    try {
        const redis = require('../config/redis');
        const cacheKey = `session:${req.user._id || req.user.id}`;
        
        await redis.del(cacheKey);
        
        res.status(200).json({ success: true, message: 'Successfully logged out' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ success: false, message: 'Server Error during logout' });
    }
};

