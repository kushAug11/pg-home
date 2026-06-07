const crypto = require('crypto');
const AuthToken = require('../models/AuthToken');

/**
 * Create Activation Token
 * Generates a secure random token, hashes it, and stores it in AuthToken collection.
 * Returns the PLAINTEXT token to be sent to the user.
 */
const createActivationToken = async (user) => {
    // 1. Generate secure random token (32 bytes hex)
    const token = crypto.randomBytes(32).toString('hex');

    // 2. Hash it for storage
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // 3. Set expiry (24 hours)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // 4. Store in DB
    await AuthToken.create({
        user_id: user._id,
        pg_id: user.pg_id,
        token_hash: tokenHash,
        token_type: 'ACTIVATION',
        expires_at: expiresAt
    });

    return token; // Return plaintext for email/sms
};

/**
 * Validate Token
 * Checks if token exists, matches hash, and is not expired.
 * Returns User ID if valid.
 */
const validateToken = async (plainToken, type = 'ACTIVATION') => {
    if (!plainToken) return null;
    
    const cleanToken = plainToken.trim();
    const tokenHash = crypto.createHash('sha256').update(cleanToken).digest('hex');

    const record = await AuthToken.findOne({
        token_hash: tokenHash,
        token_type: type,
        expires_at: { $gt: new Date() },
        // used_at: { $exists: false } // TEMPORARILY DISABLED FOR DEBUG
    });

    if (!record) return null;

    // Mark as used (TEMPORARILY DISABLED)
    // record.used_at = new Date();
    // await record.save();

    return record.user_id;
};

module.exports = { createActivationToken, validateToken };
