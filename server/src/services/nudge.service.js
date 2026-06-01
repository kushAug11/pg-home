const User = require('../models/User');
const PG = require('../models/PG');
const tokenService = require('./token.service');
const communicationService = require('./communication.service');
const OnboardingAnalytics = require('../models/OnboardingAnalytics');
const Tenant = require('../models/Tenant'); // Import Tenant model

/**
 * Check Pending Activations (AI Nudge Logic)
 * Scans DB for users in PENDING_ACTIVATION state for > 24h (or configured time).
 * Sends reminders.
 */
const checkPendingActivations = async () => {
    console.log('[AI NUDGE] Scanning for pending activations...');

    // Rule: Created > 24 hours ago AND Status is PENDING
    // AND (Never nudged OR Nudged > 24 hours ago)
    const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const pendingUsers = await User.find({
        accountStatus: 'PENDING_ACTIVATION',
        createdAt: { $lt: cutoffDate },
        $or: [
            { lastNudgeSentAt: { $exists: false } },
            { lastNudgeSentAt: { $lt: cutoffDate } }
        ]
    }).populate('pg_id');

    if (pendingUsers.length === 0) {
        console.log('[AI NUDGE] No pending users found for nudge.');
        return;
    }

    console.log(`[AI NUDGE] Found ${pendingUsers.length} users. Processing in batches...`);



    // ... (existing code)

    // Helper to process single user
    const processUserNudge = async (user) => {
        try {
            console.log(`[AI NUDGE] Nudging user: ${user.email}`);

            // 1. Generate NEW Token
            const token = await tokenService.createActivationToken(user);

            // Fetch Tenant details to get mobile number for WhatsApp
            const tenant = await Tenant.findOne({ user_id: user._id });
            if (tenant && tenant.mobile) {
                user.phone = tenant.mobile; // Attach to user object for communication service
            }

            // 2. Send Communication
            await communicationService.sendOnboardingCommunication(user, user.pg_id, token, 'REMINDER');

            // 3. Log Nudge & Update User (Parallelize DB writes)
            await Promise.all([
                OnboardingAnalytics.create({
                    pg_id: user.pg_id,
                    tenant_id: user._id,
                    step: 'EMAIL_SENT',
                    meta: { type: 'NUDGE_24H' }
                }),
                User.findByIdAndUpdate(user._id, { lastNudgeSentAt: new Date() })
            ]);

        } catch (err) {
            console.error(`[AI NUDGE] Failed to nudge user ${user._id}:`, err);
        }
    };

    // Process in Batches of 10 to avoid overwhelming services
    const BATCH_SIZE = 10;
    for (let i = 0; i < pendingUsers.length; i += BATCH_SIZE) {
        const batch = pendingUsers.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(user => processUserNudge(user)));
    }
};

module.exports = { checkPendingActivations };
