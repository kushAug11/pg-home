const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true,
        index: true
    },
    actor_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    actor_role: {
        type: String, // 'admin', 'owner', 'tenant'
        required: true
    },
    target_resource: {
        type: String, // e.g., 'Tenant', 'Room'
    },
    target_id: {
        type: mongoose.Schema.Types.ObjectId // ID of the affected item
    },
    pg_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PG',
        index: true // Efficient storage for per-PG filtering
    },
    details: {
        type: Object, // Changed fields, reason, etc.
        default: {}
    },
    ip_address: String,
    timestamp: {
        type: Date,
        default: Date.now,
        index: true // For sorting
    }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
