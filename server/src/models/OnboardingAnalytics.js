const mongoose = require('mongoose');

const onboardingAnalyticsSchema = new mongoose.Schema({
    pg_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PG',
        required: true,
        index: true
    },
    tenant_id: {
        type: mongoose.Schema.Types.ObjectId, // Can be null if only email sent before user creation? No, usually tied to user/tenant
        ref: 'User'
    },
    step: {
        type: String,
        enum: ['CREATED', 'EMAIL_SENT', 'LINK_CLICKED', 'ACTIVATED', 'ACTIVATION_FAILED'],
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    meta: {
        type: Object, // Store extra info like email, error message, etc.
        default: {}
    }
});

module.exports = mongoose.model('OnboardingAnalytics', onboardingAnalyticsSchema);
