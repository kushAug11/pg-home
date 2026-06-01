const { Queue, Worker } = require('bullmq');
const logger = require('../utils/logger');
const redisInstance = require('../config/redis');

// Initialize Queue using our Redis connection
const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    maxRetriesPerRequest: null // Required specifically for BullMQ
};

const redisEnabled = !redisInstance.isDisabled;

// Create the Email Queue
const emailQueue = redisEnabled ? new Queue('email-queue', { connection }) : null;

// Optional Wrapper to gracefully handle enqueuing if Redis isn't up
const enqueueEmail = async (jobName, data) => {
    try {
        if (!redisEnabled || !redisInstance.isConnected) {
            logger.warn(`Redis disconnected. Executing Email Job [${jobName}] synchronously as fallback.`);
            await processJobDirectly({ name: jobName, data });
            return;
        }
        await emailQueue.add(jobName, data, { attempts: 3, backoff: { type: 'exponential', delay: 1000 } });
        logger.info(`Enqueued Email Job: ${jobName}`);
    } catch (err) {
        logger.error(`Failed to enqueue email job: ${err.message}`);
        // Fallback to sync execution to not drop critical auth emails
        await processJobDirectly({ name: jobName, data });
    }
};

// Background Worker Processor
const worker = redisEnabled ? new Worker('email-queue', async job => {
    logger.info(`Processing Background Job: ${job.name} (Job ID: ${job.id})`);
    await processJobDirectly(job);
}, { connection }) : null;

if (worker) {
    worker.on('completed', job => {
        logger.info(`Completed Background Job: ${job.name} (Job ID: ${job.id})`);
    });

    worker.on('failed', (job, err) => {
        logger.error(`Failed Background Job: ${job.name} (Job ID: ${job.id}) | Reason: ${err.message}`);
    });
}

// Fallback executor for synchronous processing if queue fails
async function processJobDirectly(job) {
    const emailService = require('../services/email.service');

    if (job.name === 'sendOTP') {
        await emailService.sendOTP(job.data.email, job.data.otp);
    } else if (job.name === 'sendSetupEmail') {
        await emailService.sendAccountSetupEmail(
            job.data.email,
            job.data.name,
            job.data.token,
            job.data.pgName,
            job.data.lang || 'en'
        );
    } else {
        logger.warn(`Unknown email job type: ${job.name}`);
    }
}

module.exports = { emailQueue, enqueueEmail };
