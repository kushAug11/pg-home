const { Queue, Worker } = require('bullmq');
const logger = require('../utils/logger');
const redisInstance = require('../config/redis');

// Initialize Queue using our Redis connection
const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    maxRetriesPerRequest: null 
};

const redisEnabled = !redisInstance.isDisabled;

// Create the Report Queue
const reportQueue = redisEnabled ? new Queue('report-queue', { connection }) : null;

const requestFinancialReport = async (pgId, email, format) => {
    try {
        if (!redisEnabled || !redisInstance.isConnected) {
            logger.warn(`Redis disconnected. Executing Report Job synchronously as fallback.`);
            await processReportJobDirectly({ data: { pgId, email, format } });
            return;
        }
        await reportQueue.add('generate-financial-report', { pgId, email, format }, { attempts: 3 });
        logger.info(`Enqueued Report Job for PG: ${pgId}`);
    } catch (err) {
        logger.error(`Failed to enqueue report job: ${err.message}`);
        await processReportJobDirectly({ data: { pgId, email, format } });
    }
};

// Background Worker Processor
const worker = redisEnabled ? new Worker('report-queue', async job => {
    logger.info(`Processing Report Job: ${job.name} (Job ID: ${job.id})`);
    await processReportJobDirectly(job);
}, { connection }) : null;

if (worker) {
    worker.on('completed', job => {
        logger.info(`Completed Report Job: ${job.name}`);
    });

    worker.on('failed', (job, err) => {
        logger.error(`Failed Report Job: ${job.name} - ${err.message}`);
    });
}

// Actual Report Generation Logic (Simulated Heavy Load)
async function processReportJobDirectly(job) {
    const { pgId, email, format } = job.data;
    const Payment = require('../models/Payment');
    const Expense = require('../models/Expense');
    const emailService = require('../services/email.service');

    // 1. Fetch Data (This could be a heavy aggregation query)
    const payments = await Payment.find({ pg_id: pgId, status: 'SUCCESS' });
    const expenses = await Expense.find({ pg_id: pgId });

    // 2. Build Report Data Buffer... (Normally using fast-csv or PDFkit)
    // For now we simulate time required to generate payload
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    logger.info(`Report generated for PG ${pgId}. Sending email to ${email}.`);
    
    // Instead of actual PDF/CSV logic, we'll imagine it's an S3 link
    const downloadLink = "https://example.com/reports/temp_report_link.csv";

    // Re-using the email service to notify owner.
    // In a real scenario we'd use emailService.sendReportLink(...)
    if (emailService.sendReportLink) {
         await emailService.sendReportLink(email, downloadLink);
    } else {
         logger.info(`Email service 'sendReportLink' missing. Simulating sending email to ${email}.`);
    }
}

module.exports = { reportQueue, requestFinancialReport };
