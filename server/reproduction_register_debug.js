const mongoose = require('mongoose');
const User = require('./src/models/User');
const PG = require('./src/models/PG');
const { register } = require('./src/controllers/auth.controller');
const { MONGODB_URI } = require('./src/config/env');

// Mock Req/Res
const req = {
    body: {
        name: 'Debug Owner',
        email: 'debugowner@test.com',
        password: 'password123',
        role: 'owner',
        pgName: 'Debug PG'
    }
};

const res = {
    status: function (code) {
        this.statusCode = code;
        return this; // chainable
    },
    json: function (data) {
        console.log(`[Response ${this.statusCode || 200}]`, JSON.stringify(data, null, 2));
    }
};

async function run() {
    try {
        await mongoose.connect(MONGODB_URI || 'mongodb://127.0.0.1:27017/hostel_saas_db');
        console.log('Connected to DB');

        // Cleanup
        await User.deleteOne({ email: 'debugowner@test.com' });

        // Run Controller
        console.log('Running Register Controller...');
        await register(req, res);

    } catch (err) {
        console.error('Script Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
