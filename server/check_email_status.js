const mongoose = require('mongoose');
const User = require('./src/models/User');
const Tenant = require('./src/models/Tenant');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const checkEmail = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const email = 'mahereddy2002@gmail.com';

        console.log(`Checking status for: ${email}`);

        const user = await User.findOne({ email });
        if (!user) {
            console.log('❌ User not found in DB.');
        } else {
            console.log('✅ User Found:');
            console.log(`   - ID: ${user._id}`);
            console.log(`   - Name: ${user.name}`);
            console.log(`   - Role: ${user.role}`);
            console.log(`   - Created: ${user.createdAt}`);

            if (user.role === 'owner') {
                console.log('⚠️  This is an OWNER account. Cannot use this email for a Tenant.');
            } else if (user.role === 'tenant') {
                const tenant = await Tenant.findOne({ user_id: user._id });
                console.log('ℹ️  Tenant Profile Exists?', tenant ? 'Yes' : 'No');
            }
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

checkEmail();
