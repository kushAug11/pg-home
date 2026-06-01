const mongoose = require('mongoose');

const messMenuSchema = new mongoose.Schema({
    pg_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PG',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    meals: {
        breakfast: { type: String, default: '' },
        lunch: { type: String, default: '' },
        dinner: { type: String, default: '' },
        snacks: { type: String, default: '' }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

messMenuSchema.index({ pg_id: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('MessMenu', messMenuSchema);
