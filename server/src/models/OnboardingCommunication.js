const mongoose = require('mongoose');

const onboardingCommunicationSchema = new mongoose.Schema({
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
    channel: {
        type: String,
        enum: ['EMAIL', 'SMS', 'WHATSAPP'],
        required: true
    },
    template_key: {
        type: String, // e.g., 'setupEmailBody'
        required: false
    },
    delivery_status: {
        type: String,
        enum: ['SENT', 'FAILED', 'DELIVERED'], // DELIVERED usually via callback
        default: 'SENT'
    },
    sent_at: {
        type: Date,
        default: Date.now
    },
    metadata: {
        type: Object,
        default: {}
    }
});

module.exports = mongoose.model('OnboardingCommunication', onboardingCommunicationSchema);
