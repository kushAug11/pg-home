const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const verifyEmail = async () => {
    console.log("--- Verifying Email Configuration ---");
    console.log(`Email: ${process.env.SMTP_EMAIL}`);
    // Hide most of the password for security in logs
    const pass = process.env.SMTP_PASSWORD || '';
    console.log(`Password (masked): ${pass.substring(0, 3)}...${pass.substring(pass.length - 2)}`);

    if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
        console.error("❌ Error: SMTP_EMAIL or SMTP_PASSWORD is missing in .env");
        return;
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD
        }
    });

    try {
        console.log("1. Testing Connection to Gmail...");
        await transporter.verify();
        console.log("✅ Connection Successful!");

        console.log("2. Sending Test Email to yourself...");
        const info = await transporter.sendMail({
            from: process.env.SMTP_EMAIL,
            to: process.env.SMTP_EMAIL, // Send to self
            subject: 'HostelMate SMTP Verification',
            text: 'If you see this, your email configuration is working correctly!'
        });

        console.log(`✅ Test Email Sent! ID: ${info.messageId}`);
        console.log("-----------------------------------------");
        console.log("🎉 SUCCESS: Your email credentials are valid.");
        console.log("You can now restart your server to send real emails.");

    } catch (error) {
        console.error("❌ Verification FAILED:");
        console.error(error.message);

        if (error.responseCode === 535) {
            console.log("\n⚠️ DIAGNOSIS:\nGoogle rejected your password.");
            console.log("You are likely using your LOGIN password.");
            console.log("You MUST use an 'App Password'.");
            console.log("Go to: https://myaccount.google.com/apppasswords");
        }
    }
};

verifyEmail();
