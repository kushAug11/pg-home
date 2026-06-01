const cron = require('node-cron');
const Tenant = require('../models/Tenant');
const { sendWhatsApp } = require('./notification.service');
const { checkPendingActivations } = require('./nudge.service');

const PAYMENT_LINK = 'http://localhost:5173/tenant/payments';

/**
 * Initializes all automated cron jobs for the application.
 * Currently schedules:
 * 1. Rent Reminders (Every minute for DEMO, usually daily)
 * 2. AI Onboarding Nudges (Every hour)
 */
const initRentReminders = () => {
    // Schedule: 9am, 1pm, 5pm, 9pm everyday
    // Cron: "0 9,13,17,21 * * *"
    // For DEMO/TESTING: Run every minute "*/1 * * * *"

    console.log('[SCHEDULER] Rent Reminder Service Started (Running every minute for DEMO)...');

    /**
     * Metric: Rent Reminder Job
     * Frequency: Every 1 minute (Demo)
     * Action: Finds pending tenants and sends WhatsApp reminders via Promise.all for concurrency.
     */

    cron.schedule('*/1 * * * *', async () => {
        try {
            console.log('[JOBS] Checking for pending rent payments...');

            // Find tenants with pending rent
            const pendingTenants = await Tenant.find({ paymentStatus: 'Pending' }).populate('user_id');

            if (pendingTenants.length === 0) {
                console.log('[JOBS] No pending rent found.');
                return;
            }

            console.log(`[JOBS] Sending reminders to ${pendingTenants.length} tenants...`);

            // Optimization: Process in parallel for faster execution
            await Promise.all(pendingTenants.map(async (tenant) => {
                if (tenant.user_id && tenant.rentAmount > 0) {
                    const message = `Hello ${tenant.user_id.name}, your rent of ₹${tenant.rentAmount} is pending. Please pay immediately to avoid penalties. Click here to pay: ${PAYMENT_LINK}`;

                    // Send WhatsApp (no wait for individual to block others)
                    const phone = tenant.contact || '9999999999';
                    try {
                        await sendWhatsApp(phone, message);
                    } catch (err) {
                        console.error(`[JOBS] Failed to send to ${tenant.user_id.email}:`, err.message);
                    }
                }
            }));

        } catch (error) {
            console.error('[JOBS] Rent Reminder Error:', error.message);
        }
    });

    // AI Nudge Scheduler (Runs every hour)
    console.log('[SCHEDULER] AI Onboarding Nudge Service Started...');
    cron.schedule('0 * * * *', async () => { // Every hour
        try {
            await checkPendingActivations();
        } catch (error) {
            console.error('[JOBS] Nudge Error:', error);
        }
    });
};

module.exports = { initRentReminders };
