const mongoose = require('mongoose');

const preAuthVisitorSchema = new mongoose.Schema({
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
        enum: ['Delivery', 'Visit', 'Maintenance', 'Other'],
        required: true
    },
    visitDate: {
        type: Date,
        required: true
    },
    qrCodeToken: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'CHECKED_IN', 'EXPIRED'],
        default: 'PENDING'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

preAuthVisitorSchema.index({ pg_id: 1, status: 1 });
preAuthVisitorSchema.index({ tenant_id: 1 });

module.exports = mongoose.model('PreAuthVisitor', preAuthVisitorSchema);
