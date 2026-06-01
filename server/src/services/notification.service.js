/**
 * MOCK Notification Service
 * Logs messages to console instead of sending real SMS/WhatsApp
 * Replace with Twilio/Meta API in Production
 */

const sendWhatsApp = async (to, message) => {
    console.log('\x1b[36m%s\x1b[0m', '==================================================');
    console.log('\x1b[36m%s\x1b[0m', `[WHATSAPP] Sending to: ${to}`);
    console.log('\x1b[36m%s\x1b[0m', `[MESSAGE] ${message}`);
    console.log('\x1b[36m%s\x1b[0m', '==================================================');
    return true; // Simulate success
};

const sendSMS = async (to, message) => {
    console.log('\x1b[33m%s\x1b[0m', '..................................................');
    console.log('\x1b[33m%s\x1b[0m', `[SMS] Sending to: ${to}`);
    console.log('\x1b[33m%s\x1b[0m', `[CONTENT] ${message}`);
    console.log('\x1b[33m%s\x1b[0m', '..................................................');
    return true;
};

module.exports = { sendWhatsApp, sendSMS };
