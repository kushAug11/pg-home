/**
 * STRICT DATA ISOLATION MIDDLEWARE
 * 
 * Enforces Zero Trust policy:
 * 1. Owners/Tenants MUST have a pg_id in their token/profile.
 * 2. Blocks access if pg_id is missing for these roles.
 * 3. Prevents Parameter Tampering (e.g. User trying to pass different pg_id in body).
 */

const enforceIsolation = (req, res, next) => {
    // 1. Skip for Open Routes or Super Admin
    if (!req.user || req.user.role === 'admin') {
        return next();
    }

    // 2. Enforce PG ID Presence
    // Every Owner/Tenant MUST belong to a PG context
    if (!req.user.pg_id) {
        console.error(`[SECURITY TRAP] User ${req.user._id} (${req.user.role}) has NO pg_id!`);
        return res.status(403).json({
            success: false,
            message: 'Security Violation: User context missing PG ID. Access Denied.'
        });
    }

    // 3. Body Sanitation (Prevent ID Tampering)
    // If a user tries to inject a 'pg_id' in the body tailored to another PG,
    // we strictly OVERWRITE it with the trusted Token pg_id.
    if (req.body && req.body.pg_id) {
        if (req.body.pg_id !== req.user.pg_id.toString()) {
            console.warn(`[SECURITY WARN] User ${req.user._id} tried to manipulate pg_id in body. Overwriting.`);
        }
    }

    // Forcefully set the pg_id to the trusted one
    if (req.body) {
        req.body.pg_id = req.user.pg_id;
    }
    // Also set in params for consistency and security
    if (req.params && req.params.pg_id) {
        if (req.params.pg_id !== req.user.pg_id.toString()) {
            console.warn(`[SECURITY WARN] User ${req.user._id} tried to manipulate pg_id in params. Overwriting.`);
        }
        req.params.pg_id = req.user.pg_id;
    }

    next();
};

module.exports = { enforceIsolation };
