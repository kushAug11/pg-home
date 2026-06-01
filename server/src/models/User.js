const mongoose = require('mongoose');

/**
 * User Schema
 * Core identity model for all users (Admin, Owner, Tenant).
 * Handles authentication, role management, and account status.
 */
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    // Strict Email Validation
    // Regex enforces standard email format to prevent injection or bad data.
    email: {
        type: String,
        required: true,
        unique: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    password: {
        type: String,
        required: true
    },
    // RBAC Role
    role: {
        type: String,
        enum: ['admin', 'owner', 'tenant'],
        default: 'tenant'
    },
    // Force password change on first login or after reset
    mustChangePassword: {
        type: Boolean,
        default: false
    },
    // Tokens for account setup (Magic Links)
    setupToken: {
        type: String,
        index: true
    },
    setupTokenExpires: Date,

    // Password Reset OTP Fields
    resetPasswordOtp: {
        type: String
    },
    resetPasswordExpires: {
        type: Date
    },

    // Account Lifecycle State
    accountStatus: {
        type: String,
        enum: ['PENDING_ACTIVATION', 'ACTIVE', 'SUSPENDED', 'DEACTIVATED'],
        default: 'PENDING_ACTIVATION'
    },
    preferredLanguage: {
        type: String,
        default: 'en'
    },
    // For Owners: Links to their owned PG (Direct Linkage)
    // For Tenants: Links to the PG they reside in
    pg_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PG'
    },
    // Self-Reference: Who created this user? (e.g. Owner creates Tenant)
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    // Tracks the last time an automated "Nudge" email was sent to avoid spamming
    lastNudgeSentAt: {
        type: Date
    }
});

// Index for multi-tenant isolation lookups
userSchema.index({ pg_id: 1 });
userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);
