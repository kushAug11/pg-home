const Razorpay = require('razorpay');
const crypto = require('crypto');

class PaymentService {
    constructor() {
        this.key_id = process.env.RAZORPAY_KEY_ID;
        this.key_secret = process.env.RAZORPAY_KEY_SECRET;

        this.isMockMode = !this.key_id || !this.key_secret || this.key_id.startsWith('mock_');

        if (!this.isMockMode) {
            this.instance = new Razorpay({
                key_id: this.key_id,
                key_secret: this.key_secret,
            });
            console.log("💳 Payment Service: Real Mode (Razorpay Configured)");
        } else {
            console.log("⚠️ Payment Service: Mock Mode (Keys missing or invalid)");
            // Ensure we have some values to prevent frontend crash
            this.key_id = this.key_id || 'mock_key_id';
            this.key_secret = this.key_secret || 'mock_key_secret';
        }
    }

    /**
     * Create an Order
     * @param {number} amount Amount in smallest currency unit (paise)
     * @param {string} currency INR
     * @param {string} receipt Receipt ID
     * @returns {Promise<Object>} Order Details
     */
    async createOrder(amount, currency = 'INR', receipt) {
        if (this.isMockMode) {
            // MOCK LOGIC
            await new Promise(resolve => setTimeout(resolve, 300));
            const orderId = 'order_' + crypto.randomBytes(8).toString('hex');
            return {
                id: orderId,
                entity: 'order',
                amount: amount,
                amount_paid: 0,
                amount_due: amount,
                currency: currency,
                receipt: receipt,
                status: 'created',
                attempts: 0,
                created_at: Math.floor(Date.now() / 1000),
            };
        } else {
            // REAL LOGIC
            try {
                const options = {
                    amount: amount,
                    currency: currency,
                    receipt: receipt,
                };
                return await this.instance.orders.create(options);
            } catch (error) {
                console.error("Razorpay Order Creation Failed:", error);
                throw new Error("Payment Gateway Error");
            }
        }
    }

    /**
     * Verify Payment Signature
     * @param {string} orderId 
     * @param {string} paymentId 
     * @param {string} signature 
     * @returns {boolean} isValid
     */
    verifySignature(orderId, paymentId, signature) {
        if (this.isMockMode) {
            // MOCK LOGIC
            if (signature === 'mock_signature') return true;
            // Check against mock secret anyway for test consistency
            try {
                const generatedSignature = crypto.createHmac('sha256', this.key_secret)
                    .update(orderId + '|' + paymentId)
                    .digest('hex');
                return generatedSignature === signature;
            } catch (e) { return false; }
        } else {
            // REAL LOGIC
            const generatedSignature = crypto.createHmac('sha256', this.key_secret)
                .update(orderId + '|' + paymentId)
                .digest('hex');
            return generatedSignature === signature;
        }
    }

    /**
     * Generate Mock Signature for Testing
     * @param {string} orderId 
     * @param {string} paymentId 
     * @returns {string} signature
     */
    generateMockSignature(orderId, paymentId) {
        return crypto.createHmac('sha256', this.key_secret)
            .update(orderId + '|' + paymentId)
            .digest('hex');
    }
}

module.exports = new PaymentService();
