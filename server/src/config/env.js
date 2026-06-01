const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && !process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required in production');
}

if (isProduction && !process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required in production');
}

module.exports = {
    PORT: process.env.PORT || 5000,
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/hostel_saas_db',
    JWT_SECRET: process.env.JWT_SECRET || 'development_jwt_secret_change_me',
    NODE_ENV: process.env.NODE_ENV || 'development',
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
    SMTP_EMAIL: process.env.SMTP_EMAIL,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD,
    WHATSAPP_API_TOKEN: process.env.WHATSAPP_API_TOKEN
};
