const { NODE_ENV } = require('../config/env');
const logger = require('../utils/logger');

/**
 * API Error Class
 * Extends standard Error to include statusCode
 */
class ApiError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Central Error Handling Middleware
 * Standardizes all API responses to { success: false, message: ... }
 */
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
    error.statusCode = err.statusCode || 500;

    // Log using Winston
    logger.error(`💥 ERROR [${err.name}]: ${err.message}`, { stack: err.stack, path: req.path, method: req.method });

    // Mongoose Bad ObjectId
    if (err.name === 'CastError') {
        const message = `Resource not found. Invalid: ${err.path}`;
        error = new ApiError(404, message);
    }

    // Mongoose Duplicate Key
    if (err.code === 11000) {
        const message = 'Duplicate field value entered';
        error = new ApiError(400, message);
    }

    // Mongoose Validation Error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join(', ');
        error = new ApiError(400, message);
    }

    // JWT Errors
    if (err.name === 'JsonWebTokenError') {
        error = new ApiError(401, 'Invalid token. Please log in again.');
    }
    if (err.name === 'TokenExpiredError') {
        error = new ApiError(401, 'Your token has expired! Please log in again.');
    }

    // MongoDB Connection Errors
    if (err.name === 'MongooseServerSelectionError' || err.name === 'MongoNetworkError') {
        error = new ApiError(503, 'Database connection failed. Our engineers are on it. Please try again later.');
    }

    res.status(error.statusCode).json({
        success: false,
        message: error.message || 'Server Error',
        stack: NODE_ENV === 'development' ? err.stack : undefined
    });
};

module.exports = { errorHandler, ApiError };
