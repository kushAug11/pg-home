const mongoose = require('mongoose');
const Notice = require('./src/models/Notice');
const { MONGODB_URI } = require('./src/config/env');

async function verifyNoticeFix() {
    try {
        await mongoose.connect(MONGODB_URI || 'mongodb://127.0.0.1:27017/hostel_saas_db');
        console.log('Connected to DB');

        // Create a Mock PG ID (Valid ObjectId)
        const mockPgId = new mongoose.Types.ObjectId();

        console.log('Attempting to create Notice with lowercase type "info"...');

        try {
            const notice = await Notice.create({
                pg_id: mockPgId,
                title: 'Verification Notice',
                message: 'Testing if lowercase enum works',
                type: 'info' // This used to fail
            });
            console.log('✅ SUCCESS: Notice created successfully!');
            console.log('Type stored:', notice.type);
        } catch (validationErr) {
            console.error('❌ VALIDATION FAILED:', validationErr.message);
        }

    } catch (err) {
        console.error('Script Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

verifyNoticeFix();
