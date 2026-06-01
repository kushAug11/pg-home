const mongoose = require('mongoose');

/**
 * Payment Schema
 * Tracks all financial transactions within the application.
 * Supports various payment types (Rent, Subscription, etc.) and modes.
 */
const paymentSchema = new mongoose.Schema({
  // Link to the PG this payment belongs to (Index for analytics)
  pg_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PG',
    required: true
  },
  // User who initiated the payment
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Optional: Link to specific Tenant profile if applicable
  tenant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant'
  },
  // Amount in smallest currency unit (e.g., paise for INR) or standard unit? 
  // Razorpay usually expects paise, but check service layer. 
  // Assuming Standard Unit here based on usage (5000) or check consistency.
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  // Purpose of the payment
  type: {
    type: String,
    enum: ['RENT', 'SUBSCRIPTION', 'DEPOSIT', 'OTHER', 'MESS'],
    required: true
  },
  // Method of payment
  payment_mode: {
    type: String,
    enum: ['ONLINE', 'CASH', 'UPI_MANUAL', 'BANK_TRANSFER'],
    default: 'ONLINE'
  },
  // Transaction Lifecycle Status
  status: {
    type: String,
    enum: ['CREATED', 'ATTEMPTED', 'SUCCESS', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'],
    default: 'CREATED'
  },
  // Razorpay Specific Fields
  gateway_order_id: {
    type: String,
    unique: true // Ensures 1:1 mapping with Gateway Orders
  },
  gateway_payment_id: String,
  gateway_signature: String,

  transaction_date: {
    type: Date,
    default: Date.now
  },
  // Flag to ensure post-payment logic (like activating subscription) runs only once
  subscription_processed: {
    type: Boolean,
    default: false
  },
  // Flexible field for extra data (e.g. month name, specific notes)
  metadata: Object
});

// Indexes for common queries:
// 1. Fetching all payments for a PG
// 2. Analytics: Successful payments per PG
// 3. Recent transactions
paymentSchema.index({ pg_id: 1 });
paymentSchema.index({ pg_id: 1, status: 1 });
paymentSchema.index({ pg_id: 1, transaction_date: -1 });
paymentSchema.index({ tenant_id: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
