const mongoose = require('mongoose');

const pgSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  owner_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  address: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  description: String,
  facilities: [String],
  subscription: {
    plan: {
      type: String,
      enum: ['Free', 'Starter', 'Pro', 'Enterprise'],
      default: 'Free'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'past_due']
    },
    startDate: Date,
    expiryDate: Date,
    razorpay_customer_id: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

pgSchema.index({ owner_id: 1 });

module.exports = mongoose.model('PG', pgSchema);
