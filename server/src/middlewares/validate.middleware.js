const logger = require('../utils/logger');
const { ApiError } = require('./error.middleware');

/**
 * Zod Validation Middleware
 * Validates request payload (body, query, params) against a given Zod schema.
 */
const validate = (schema) => (req, res, next) => {
    try {
        schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        next();
    } catch (err) {
        if (err.errors || err.issues) {
            const errors = err.errors || err.issues;
            logger.warn(`[VALIDATION FAILED] ${req.method} ${req.originalUrl}`, { errors });
            const errorMessages = errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
            return next(new ApiError(400, `Validation Error: ${errorMessages}`));
        }
        logger.error(`[VALIDATION MIDDLEWARE SYSTEM ERROR]`, err);
        return next(err);
    }
};

module.exports = validate;
