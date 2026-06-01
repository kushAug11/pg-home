const mongoose = require('mongoose');

/**
 * Execute a function within a transaction
 * @param {Function} operation - Async function receiving the session
 * @returns {Promise<any>} Result of the operation
 */
const withTransaction = async (operation) => {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        const result = await operation(session);
        await session.commitTransaction();
        return result;
    } catch (error) {
        // If in transaction, abort it
        if (session.inTransaction()) {
            await session.abortTransaction();
        }

        // Check for specific MongoDB Replica Set or transient environment errors
        // Code 20 or specific message content
        if ((error.message && (
            error.message.includes('Transaction numbers are only allowed') ||
            error.message.includes('replica set') ||
            error.message.includes('catalog changes') ||
            error.message.includes('WriteConflict')
        )) || error.code === 112 || (error.errorLabels && error.errorLabels.includes('TransientTransactionError'))) {
            console.warn("⚠️ MongoDB Transaction failed (likely standalone or transient catalog issue). Retrying operation without transaction...");
            // Retry the operation without a session (Direct execution)
            return await operation(undefined);
        }

        console.error("Transaction Aborted due to error:", error.message);
        throw error;
    } finally {
        await session.endSession();
    }
};

module.exports = { withTransaction };
