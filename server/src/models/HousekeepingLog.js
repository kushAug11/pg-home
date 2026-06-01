const mongoose = require('mongoose');

const housekeepingLogSchema = new mongoose.Schema({
    pg_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PG',
        required: true
    },
    room_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['Cleaned', 'Skipped', 'Pending'],
        default: 'Pending'
    },
    cleanedBy: {
        type: String,
        default: ''
    },
    remarks: {
        type: String,
        default: ''
    }
});

// Compound index to ensure one log per room per day (or fast lookup)
housekeepingLogSchema.index({ pg_id: 1, date: 1, room_id: 1 }, { unique: true });

// Optimized index for dashboard lookups (room_id + date sort)
housekeepingLogSchema.index({ room_id: 1, date: -1 });

module.exports = mongoose.model('HousekeepingLog', housekeepingLogSchema);
