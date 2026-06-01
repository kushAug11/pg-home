const redisClient = require('../config/redis');
const logger = require('../utils/logger');

/**
 * Cache middleware that stores and retrieves responses from Redis.
 * @param {number} duration - Cache duration in seconds
 */
const cacheRoute = (duration) => async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
        return next();
    }

    // Skip caching if Redis is disabled or disconnected
    if (redisClient.isDisabled || !redisClient.isConnected) {
        return next();
    }

    try {
        // Create a unique key for this request based on URL and user ID
        const userId = req.user ? req.user._id.toString() : 'guest';
        const key = `cache:${req.originalUrl || req.url}:${userId}`;

        const cachedResponse = await redisClient.get(key);

        if (cachedResponse) {
            // Serve from cache
            return res.json(cachedResponse);
        }

        // Intercept res.json to cache the output before sending
        const originalJson = res.json.bind(res);
        res.json = (body) => {
            // Only cache successful responses
            if (res.statusCode >= 200 && res.statusCode < 300) {
                redisClient.setEx(key, duration, body).catch(err => {
                    logger.error(`Failed to cache response for key ${key}: ${err.message}`);
                });
            }
            return originalJson(body);
        };

        next();
    } catch (error) {
        logger.error(`Cache Middleware Error: ${error.message}`);
        next();
    }
};

module.exports = {
    cacheRoute
};
