const Redis = require('ioredis');
const logger = require('../utils/logger'); // Assuming winston logger exists

class RedisClient {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.isDisabled = process.env.REDIS_DISABLED === 'true' || process.env.NODE_ENV === 'test';
    }

    connect() {
        if (this.client) return this.client;
        if (this.isDisabled) {
            return null;
        }

        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        
        this.client = new Redis(redisUrl, {
            maxRetriesPerRequest: 3,
            retryStrategy(times) {
                const delay = Math.min(times * 50, 2000);
                return delay;
            }
        });

        this.client.on('connect', () => {
            this.isConnected = true;
            logger.info('🟢 Redis Connected Successfully');
        });

        this.client.on('error', (err) => {
            this.isConnected = false;
            logger.error('🔴 Redis Connection Error:', err.message);
        });

        return this.client;
    }

    // Graceful caching wrappers
    async get(key) {
        if (!this.isConnected) return null;
        try {
            const data = await this.client.get(key);
            return data ? JSON.parse(data) : null;
        } catch (err) {
            logger.error(`Redis GET Error for key ${key}:`, err.message);
            return null;
        }
    }

    async setEx(key, seconds, data) {
        if (!this.isConnected) return false;
        try {
            await this.client.setex(key, seconds, JSON.stringify(data));
            return true;
        } catch (err) {
            logger.error(`Redis SETEX Error for key ${key}:`, err.message);
            return false;
        }
    }

    async del(key) {
        if (!this.isConnected) return false;
        try {
            await this.client.del(key);
            return true;
        } catch (err) {
            logger.error(`Redis DEL Error for key ${key}:`, err.message);
            return false;
        }
    }
}

// Export singleton instance
const redisInstance = new RedisClient();
redisInstance.connect(); // Start connection asynchronously

module.exports = redisInstance;
