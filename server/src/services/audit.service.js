const AuditLog = require('../models/AuditLog');

/**
 * Log a system action
 * @param {Object} req - Express Request Object (to extract actor/IP)
 * @param {String} action - Action name (e.g., 'TENANT_ADDED', 'ROOM_DELETED')
 * @param {String} resource - Target resource type
 * @param {String} targetId - Target resource ID
 * @param {Object} details - Additional metadata
 */
const logAction = async (req, action, resource, targetId, details = {}) => {
    try {
        if (!req.user) return; // Can't log anonymous actions easily (unless we want to)

        await AuditLog.create({
            action,
            actor_id: req.user._id,
            actor_role: req.user.role,
            pg_id: req.user.pg_id || null, // Might be null for Super Admin
            target_resource: resource,
            target_id: targetId,
            details,
            ip_address: req.ip || req.connection.remoteAddress
        });
        // Console log for dev visibility
        console.log(`📝 AUDIT: ${req.user.role} ${action} on ${resource}`);

    } catch (error) {
        // Non-blocking: Audit logging failure shouldn't crash the main request 
        console.error("Audit Log Error:", error.message);
    }
};

module.exports = { logAction };
