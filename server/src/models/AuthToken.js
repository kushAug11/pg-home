const mongoose = require('mongoose');

const authTokenSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    pg_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PG',
        required: true
    },
    token_hash: {
        type: String,
        required: true,
        index: true // For fast lookups during validation
    },
    token_type: {
        type: String,
        enum: ['ACTIVATION', 'PASSWORD_RESET'],
        default: 'ACTIVATION'
    },
    expires_at: {
        type: Date,
        required: true
    },
    used_at: {
        type: Date
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('AuthToken', authTokenSchema);
