const PG = require('../models/PG');

// Check if Owner has an Active Subscription
const checkSubscription = async (req, res, next) => {
    try {
        if (!req.user.pg_id) {
            return res.status(403).json({ success: false, message: 'No PG assigned to this account.' });
        }

        const pg = await PG.findById(req.user.pg_id);

        if (!pg) {
            return res.status(404).json({ success: false, message: 'PG Not Found' });
        }

        // Logic for Subscription Status
        const { status, expiryDate } = pg.subscription;

        if (status !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'Subscription Required. Please upgrade your plan to access this feature.',
                errorType: 'SUBSCRIPTION_REQUIRED'
            });
        }

        if (expiryDate && new Date(expiryDate) < new Date()) {
            // Optional: Auto-downgrade logic could go here, but for now just block
            return res.status(403).json({
                success: false,
                message: 'Subscription Expired. Please renew your plan.',
                errorType: 'SUBSCRIPTION_EXPIRED'
            });
        }

        next();

    } catch (error) {
        console.error('Subscription Check Error:', error);
        res.status(500).json({ success: false, message: 'Server Verification Error' });
    }
};

module.exports = { checkSubscription };
