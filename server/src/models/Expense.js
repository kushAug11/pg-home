const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    pg_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PG',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    category: {
        type: String,
        enum: ['Electricity', 'Water', 'Maintenance', 'Staff Salary', 'Rent/Lease', 'Internet', 'Food/Groceries', 'Other'],
        required: true
    },
    description: {
        type: String
    },
    date: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

expenseSchema.index({ pg_id: 1, date: -1 });

module.exports = mongoose.model('Expense', expenseSchema);
