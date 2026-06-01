const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const emailService = require('./src/services/email.service');

const testWelcomeEmail = async () => {
    console.log("--- Testing Welcome Email Logic ---");
    const email = process.env.SMTP_EMAIL; // Send to self
    const name = "Test Tenant";
    const password = "debug_password_123";
    const pgName = "Debug PG";

    console.log(`Target: ${email}`);

    const result = await emailService.sendWelcomeEmail(email, name, password, pgName);

    if (result) {
        console.log("✅ Welcome Email function returned TRUE");
    } else {
        console.log("❌ Welcome Email function returned FALSE");
    }
};

testWelcomeEmail();
