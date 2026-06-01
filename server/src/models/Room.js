const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    pg_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PG',
        required: true
    },
    number: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['Single', 'Double', 'Triple', 'Dorm'],
        required: true
    },
    capacity: {
        type: Number,
        required: true,
        min: [1, 'Capacity must be at least 1']
    },
    price: {
        type: Number,
        required: true,
        min: [0, 'Rent cannot be negative']
    },
    occupied: {
        type: Number,
        default: 0
    },
    inventory: [{
        item: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'InventoryItem'
        },
        quantity: {
            type: Number,
            default: 1
        }
    }],
    // floor: Number,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

roomSchema.index({ pg_id: 1, number: 1 }, { unique: true });

module.exports = mongoose.model('Room', roomSchema);
