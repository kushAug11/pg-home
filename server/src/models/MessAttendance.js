const mongoose = require('mongoose');

const messAttendanceSchema = new mongoose.Schema({
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
    date: {
        type: Date,
        required: true
    },
    meal_type: {
        type: String,
        enum: ['breakfast', 'lunch', 'dinner', 'snacks'],
        required: true
    },
    status: {
        type: String,
        enum: ['eating', 'skipped'],
        default: 'eating'
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

messAttendanceSchema.index({ pg_id: 1, date: 1 });
messAttendanceSchema.index({ tenant_id: 1, date: 1, meal_type: 1 }, { unique: true });

module.exports = mongoose.model('MessAttendance', messAttendanceSchema);
