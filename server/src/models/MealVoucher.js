const mongoose = require('mongoose');

const mealVoucherSchema = new mongoose.Schema({
    pg_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PG',
        required: true
    },
    tenant_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true
    },
    mealType: {
        type: String,
        enum: ['Breakfast', 'Lunch', 'Dinner', 'Special'],
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    voucherCode: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    status: {
        type: String,
        enum: ['UNUSED', 'USED', 'BILLED'],
        default: 'UNUSED'
    },
    isGuestVoucher: {
        type: Boolean,
        default: false
    },
    guestName: {
        type: String,
        default: ''
    },
    purchaseDate: {
        type: Date,
        default: Date.now
    },
    useDate: {
        type: Date
    }
});

mealVoucherSchema.index({ pg_id: 1, status: 1 });
mealVoucherSchema.index({ tenant_id: 1, status: 1 });

module.exports = mongoose.model('MealVoucher', mealVoucherSchema);
