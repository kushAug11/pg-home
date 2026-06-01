const mongoose = require('mongoose');

// The URI from env.js fallback
const URI = 'mongodb://localhost:27017/hostel_saas_db';

async function testConnection() {
    console.log('--- DB Connection Diagnostics ---');
    console.log(`Attempting to connect to: ${URI.substring(0, 20)}... (hidden)`);

    try {
        await mongoose.connect(URI, { serverSelectionTimeoutMS: 5000 });
        console.log('✅ SUCCESS: Connected to Cloud MongoDB!');
        console.log('Data persistence SHOULD be working. If it is not, check if Nodemon is restarting on every save.');
    } catch (err) {
        console.error('❌ FAILURE: Could not connect to Cloud MongoDB.');
        console.error('Error Name:', err.name);
        console.error('Error Message:', err.message);

        if (err.message.includes('bad auth')) {
            console.log('-> Reason: Invalid Username or Password.');
        } else if (err.message.includes('monitor-connection-failure') || err.message.includes('SSL')) {
            console.log('-> Reason: Network Firewall (company/school internet?) or IP not Whitelisted on Atlas.');
        } else {
            console.log('-> Reason: Unknown connection error.');
        }
    } finally {
        await mongoose.disconnect();
    }
}

testConnection();
