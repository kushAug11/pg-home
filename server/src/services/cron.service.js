const cron = require('node-cron');
const { createBackup } = require('./backup.service');

const initCronJobs = () => {
    // Schedule Backup Daily at Midnight
    cron.schedule('0 0 * * *', async () => {
        console.log('⏰ Running Daily Backup...');
        try {
            const zipPath = await createBackup();
            console.log(`✅ Daily Backup Complete: ${zipPath}`);
        } catch (error) {
            console.error('❌ Daily Backup Failed:', error);
        }
    });

    console.log('📅 Cron Jobs Initialized: Daily Backup scheduled for Midnight.');

    // Schedule Nudge Job (e.g., Daily at 10 AM)
    const { checkPendingActivations } = require('./nudge.service');
    cron.schedule('0 10 * * *', async () => {
        console.log('⏰ Running Daily Nudge Job...');
        await checkPendingActivations();
    });
};

module.exports = { initCronJobs };
