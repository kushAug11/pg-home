const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
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
    purpose: {
        type: String,
        enum: ['Delivery', 'Visit', 'Maintenance', 'Interview', 'Other'],
        required: true
    },
    details: {
        type: String, // e.g., "Meeting John in Room 101"
        default: ''
    },
    entryTime: {
        type: Date,
        default: Date.now
    },
    exitTime: {
        type: Date
    },
    status: {
        type: String,
        enum: ['INSIDE', 'EXITED'],
        default: 'INSIDE'
    }
});

visitorSchema.index({ pg_id: 1, status: 1 });
visitorSchema.index({ pg_id: 1, entryTime: -1 });

module.exports = mongoose.model('Visitor', visitorSchema);
