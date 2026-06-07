const mongoose = require('mongoose');
const Payment = require('./src/models/Payment');

async function checkPayments() {
    await mongoose.connect('mongodb+srv://kushagra1108ss:Kush1108@cluster0.udwk60s.mongodb.net/hostel_saas_db?retryWrites=true&w=majority&appName=Cluster0');
    const payments = await Payment.find({});
    console.log('Total Payments:', payments.length);
    console.log(JSON.stringify(payments, null, 2));
    process.exit(0);
}

checkPayments();
