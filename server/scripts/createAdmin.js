const mongoose = require('mongoose');
const User = require('../src/models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const uniqueId = 'testv2';
        const email = `admin_${uniqueId}@hostel.com`;
        const password = 'password123';

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const admin = await User.create({
            name: 'Super Admin Direct',
            email: email,
            password: hashedPassword,
            role: 'admin'
        });

        console.log(`LOGIN_CREDENTIALS|admin|${email}|${password}`);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

createAdmin();
