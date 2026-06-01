const mongoose = require('mongoose');

const visitRequestSchema = new mongoose.Schema({
    pg_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PG',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    email: {
        type: String
    },
    visitDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Contacted', 'Scheduled', 'Visited', 'Converted', 'Closed'],
        default: 'Pending'
    },
    notes: {
        type: String
    }
}, { timestamps: true });

visitRequestSchema.index({ pg_id: 1, status: 1 });

module.exports = mongoose.model('VisitRequest', visitRequestSchema);
