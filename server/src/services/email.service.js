const nodemailer = require('nodemailer');
const { getTemplate, fillTemplate } = require('../config/i18n');

// Create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
    service: 'gmail', // Use 'gmail' or configure host/port manually
    auth: {
        user: process.env.SMTP_EMAIL || 'test@example.com',
        pass: process.env.SMTP_PASSWORD || 'password'
    }
});

// Helper: Retry with Exponential Backoff
const retryOperation = async (fn, retries = 3, delay = 1000) => {
    try {
        return await fn();
    } catch (error) {
        if (retries === 0) throw error;
        console.warn(`⚠️ Operation failed. Retrying in ${delay}ms... (${retries} attempts left)`);
        await new Promise(res => setTimeout(res, delay));
        return retryOperation(fn, retries - 1, delay * 2);
    }
};

/**
 * Send OTP to user email
 * @param {string} to - Recipient email
 * @param {string} otp - The 6-digit OTP
 */
const sendOTP = async (to, otp) => {
    return retryOperation(async () => {
        try {
            // If no real SMTP credentials are provided, we just log to console for Dev/Audit
            if (!process.env.SMTP_EMAIL || process.env.SMTP_EMAIL === 'test@example.com' || process.env.SMTP_EMAIL === 'mock_admin@hostel.com') {
                console.log('==================================================');
                console.log(`[DEV MODE] Sending OTP to ${to}`);
                console.log(`[OTP] >>>> ${otp} <<<<`);
                console.log('==================================================');
                return true;
            }

            const mailOptions = {
                from: process.env.SMTP_EMAIL,
                to: to,
                subject: 'Password Reset OTP - HostelMate',
                text: `Your OTP for password reset is: ${otp}. It is valid for 10 minutes.`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #4F46E5;">Password Reset Request</h2>
                        <p>You requested a password reset for your HostelMate account.</p>
                        <p>Your One-Time Password (OTP) is:</p>
                        <div style="background-color: #F3F4F6; padding: 15px; border-radius: 8px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold; color: #1F2937;">
                            ${otp}
                        </div>
                        <p>This OTP is valid for 10 minutes. If you did not request this, please ignore this email.</p>
                    </div>
                `
            };

            const info = await transporter.sendMail(mailOptions);
            console.log('Message sent: %s', info.messageId);
            return true;
        } catch (error) {
            console.error('Error sending email:', error);
            throw error; // Throw to trigger retry
        }
    });
};

/**
 * Send Welcome Email to new Tenant (Legacy/Alternative)
 * @param {string} email - Tenant Email
 * @param {string} name - Tenant Name
 * @param {string} password - Tenant Password
 * @param {string} pgName - PG Name
 */
const sendWelcomeEmail = async (email, name, password, pgName) => {
    return retryOperation(async () => {
        try {
            if (!process.env.SMTP_EMAIL || process.env.SMTP_EMAIL === 'test@example.com' || process.env.SMTP_EMAIL === 'mock_admin@hostel.com') {
                console.log('==================================================');
                console.log(`[DEV MODE] Sending WELCOME EMAIL to ${email}`);
                console.log(`[CREDENTIALS] Email: ${email} | Password: ${password}`);
                console.log('[TIP] To send REAL emails, set SMTP_EMAIL and SMTP_PASSWORD in server/.env');
                console.log('==================================================');
                return true;
            }

            const mailOptions = {
                from: process.env.SMTP_EMAIL,
                to: email,
                subject: `Welcome to ${pgName} - Your Login Details`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                        <h2 style="color: #4F46E5; text-align: center;">Welcome to ${pgName}!</h2>
                        <p>Hello <strong>${name}</strong>,</p>
                        <p>You have been successfully added as a tenant. Here are your login credentials to access the HostelMate portal:</p>
                        
                        <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 5px 0;"><strong>📧 Email:</strong> ${email}</p>
                            <p style="margin: 5px 0;"><strong>🔑 Password:</strong> <span style="font-family: monospace; background: #fff; padding: 2px 5px; border-radius: 4px;">${password}</span></p>
                        </div>

                        <div style="background-color: #FEF2F2; border: 1px solid #F87171; color: #991B1B; padding: 10px; border-radius: 5px; margin-bottom: 20px;">
                            <strong>⚠️ Important:</strong> For security reasons, you are required to change this password immediately upon your first login.
                        </div>

                        <p>Please login and change your password immediately.</p>
                        
                        <div style="text-align: center; margin-top: 30px;">
                            <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/login" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login to Dashboard</a>
                        </div>
                    </div>
                `
            };

            const info = await transporter.sendMail(mailOptions);
            console.log('Welcome Email sent: %s', info.messageId);
            return true;
        } catch (error) {
            console.error('Error sending welcome email:', error);
            throw error; // Trigger Retry
        }
    });
};

/**
 * Send Account Setup Email (Magic Link)
 * @param {string} email - User Email
 * @param {string} name - User Name
 * @param {string} token - Setup Token
 * @param {string} pgName - PG Name
 * @param {string} lang - Language Code (default: 'en')
 */
const sendAccountSetupEmail = async (email, name, token, pgName, lang = 'en') => {
    return retryOperation(async () => {
        try {
            const setupLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/setup-account?token=${token}`;

            // Fetch and Fill Templates
            const subjectTemplate = getTemplate(lang, 'setupEmailSubject');
            const bodyTemplate = getTemplate(lang, 'setupEmailBody');

            const subject = fillTemplate(subjectTemplate, { PG_NAME: pgName });
            const html = fillTemplate(bodyTemplate, {
                TENANT_NAME: name,
                PG_NAME: pgName,
                TENANT_EMAIL: email,
                ACTIVATION_LINK: setupLink,
                LINK_EXPIRY_TIME: '24 hours'
            });

            if (!process.env.SMTP_EMAIL || process.env.SMTP_EMAIL === 'test@example.com' || process.env.SMTP_EMAIL === 'mock_admin@hostel.com') {
                console.log('==================================================');
                console.log(`[DEV MODE] Sending SETUP EMAIL to ${email} (${lang})`);
                console.log(`[LINK] ${setupLink}`);
                console.log('==================================================');
                return true;
            }

            const mailOptions = {
                from: process.env.SMTP_EMAIL,
                to: email,
                subject: subject,
                html: html
            };

            const info = await transporter.sendMail(mailOptions);
            console.log('Setup Email sent: %s', info.messageId);
            return true;
        } catch (error) {
            console.error('Error sending setup email:', error);
            throw error; // Trigger Retry
        }
    });
};

module.exports = { sendOTP, sendWelcomeEmail, sendAccountSetupEmail };
