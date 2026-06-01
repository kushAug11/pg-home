const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
    pg_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PG',
        required: true
    },
    tenant_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant', // or User
        required: true
    },
    title: {
        type: String,
        required: true,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    status: {
        type: String,
        enum: ['Pending', 'In Progress', 'Resolved'], // Updated Enums
        default: 'Pending'
    },
    category: {
        type: String,
        enum: ['WiFi', 'Plumbing', 'Electrical', 'Food', 'Cleaning', 'Other'],
        default: 'Other'
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium'
    },
    adminComment: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

complaintSchema.index({ pg_id: 1, createdAt: -1 });

module.exports = mongoose.model('Complaint', complaintSchema);
