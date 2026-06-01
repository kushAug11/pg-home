const rateLimit = require('express-rate-limit');

// Strict rate limiter for sensitive routes (Login, Register, Password Reset)
const strictRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again after 15 minutes.'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skip: () => process.env.NODE_ENV === 'test' // BUG-FIX: Skip rate limits during automated testing
});

module.exports = {
    strictRateLimiter
};
