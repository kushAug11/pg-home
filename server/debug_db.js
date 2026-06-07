const mongoose = require('mongoose');
const AuthToken = require('./src/models/AuthToken');

async function checkTokens() {
    await mongoose.connect('mongodb+srv://kushagra1108ss:Kush1108@cluster0.udwk60s.mongodb.net/hostel_saas_db?retryWrites=true&w=majority&appName=Cluster0');
    const tokens = await AuthToken.find({}).sort({ createdAt: -1 }).limit(5);
    console.log(JSON.stringify(tokens, null, 2));
    process.exit(0);
}

checkTokens();
