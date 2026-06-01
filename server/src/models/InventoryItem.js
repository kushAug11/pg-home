const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema({
    pg_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PG',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['Furniture', 'Electronics', 'Linen', 'Kitchen', 'Other'],
        default: 'Other'
    },
    total_qty: {
        type: Number,
        required: true,
        default: 0
    },
    available_qty: {
        type: Number,
        required: true,
        default: 0
    },
    cost: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

inventoryItemSchema.index({ pg_id: 1 });

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);
