const mongoose = require('mongoose');

const guestRequestSchema = new mongoose.Schema({
    pg_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PG',
        required: true
    },
    tenant_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true
    },
    guest_name: {
        type: String,
        required: true
    },
    relation: {
        type: String,
        required: true
    },
    fromDate: {
        type: Date,
        required: true
    },
    toDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED'],
        default: 'PENDING'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

guestRequestSchema.index({ pg_id: 1, status: 1 });
guestRequestSchema.index({ tenant_id: 1 });

module.exports = mongoose.model('GuestRequest', guestRequestSchema);
