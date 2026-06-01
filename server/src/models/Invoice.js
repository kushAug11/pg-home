const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
    invoice_number: {
        type: String,
        required: true,
        unique: true
    },
    pg_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PG',
        required: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    payment_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment',
        required: true
    },
    customer_details: {
        name: String,
        address: String,
        gstin: String
    },
    line_items: [{
        description: String,
        amount: Number,
        tax_code: String
    }],
    financials: {
        base_amount: Number, // Amount before Tax
        tax_amount: Number,
        total_amount: Number,
        currency: {
            type: String,
            default: 'INR'
        }
    },
    status: {
        type: String,
        enum: ['GENERATED', 'VOID', 'PAID'],
        default: 'PAID'
    },
    pdf_url: String, // Link to stored PDF
    created_at: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Invoice', InvoiceSchema);
