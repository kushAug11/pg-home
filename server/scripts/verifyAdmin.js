const mongoose = require('mongoose');
const User = require('../src/models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const verifyAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const email = 'admin_testv2@hostel.com';
        const password = 'password123';

        const user = await User.findOne({ email });
        if (!user) {
            console.log('❌ User NOT found:', email);
        } else {
            console.log('✅ User Found:', user.email);
            console.log('   Role:', user.role);

            const isMatch = await bcrypt.compare(password, user.password);
            console.log('   Password Match:', isMatch ? '✅ YES' : '❌ NO');
        }
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

verifyAdmin();
