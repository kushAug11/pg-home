const mongoose = require('mongoose');

const CreditNoteSchema = new mongoose.Schema({
    cn_number: {
        type: String,
        required: true,
        unique: true
    },
    invoice_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Invoice',
        required: true
    },
    payment_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    issued_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // Admin or System
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('CreditNote', CreditNoteSchema);
