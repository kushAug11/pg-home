const mongoose = require('mongoose');
const User = require('../src/models/User');
const dotenv = require('dotenv');
const path = require('path');

// Load Env
dotenv.config({ path: path.join(__dirname, '../.env') });

const activateUser = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to DB');

        const email = process.argv[2];

        if (!email) {
            console.log('\n⚠️  Usage: node scripts/manual_activate.js <email>');
            console.log('--- Pending Users ---');
            const pending = await User.find({ accountStatus: 'PENDING_ACTIVATION' }).select('email name role');
            if (pending.length === 0) console.log('No pending users found.');
            pending.forEach(u => console.log(`- [${u.role}] ${u.name} (${u.email})`));
            process.exit(0);
        }

        const user = await User.findOne({ email });
        if (!user) {
            console.error('❌ User not found');
            process.exit(1);
        }

        user.accountStatus = 'ACTIVE';
        user.setupToken = undefined; // Cleanup
        await user.save();

        console.log(`\n🎉 Successfully ACTIVATED user: ${email}`);
        console.log('You can now login with this account.');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

activateUser();
