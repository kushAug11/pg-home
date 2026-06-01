const mongoose = require('mongoose');

const uri = 'mongodb://127.0.0.1:27017/hostel_saas_db';

console.log('Attempting to connect to:', uri);

mongoose.connect(uri)
    .then(() => {
        console.log('✅ MongoDB Connected Successfully!');
        process.exit(0);
    })
    .catch((err) => {
        console.error('❌ MongoDB Connection Error:');
        console.error('Name:', err.name);
        console.error('Message:', err.message);
        console.error('Code:', err.code);
        process.exit(1);
    });
