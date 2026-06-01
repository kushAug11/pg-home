const crypto = require('crypto');
const logger = require('../utils/logger');

const trackingMiddleware = (req, res, next) => {
    const trace_id = req.headers['x-request-id'] || crypto.randomUUID();
    const store = new Map();
    store.set('trace_id', trace_id);

    // Provide trace_id in response headers
    res.setHeader('x-request-id', trace_id);

    // Initial Request Log
    logger.asyncLocalStorage.run(store, () => {
        logger.info(`Incoming ${req.method} ${req.url}`);
        
        // Log on finish to capture status code
        res.on('finish', () => {
            logger.info(`Response completed with status ${res.statusCode}`);
        });

        next();
    });
};

module.exports = trackingMiddleware;
