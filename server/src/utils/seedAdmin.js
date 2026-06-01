const User = require('../models/User');
const bcrypt = require('bcryptjs');

const seedAdmin = async () => {
    try {
        const adminEmail = 'admin@hostel.com';
        const user = await User.findOne({ email: adminEmail });

        if (!user) {
            console.log('🌱 Seeding Admin User...');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('adminpassword123', salt);

            await User.create({
                name: 'Super Admin',
                email: adminEmail,
                password: hashedPassword,
                role: 'admin',
                accountStatus: 'ACTIVE'
            });
            console.log('✅ Admin User Created: admin@hostel.com / adminpassword123');
        } else {
            console.log('ℹ️ Admin User already exists.');
        }
    } catch (error) {
        console.error('❌ Admin Seeding Failed:', error.message);
    }
};

module.exports = seedAdmin;
