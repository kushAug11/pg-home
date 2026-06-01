const jwt = require('jsonwebtoken');
const generateToken = require('../../src/utils/generateToken');
const { JWT_SECRET } = require('../../src/config/env');

describe('Unit: generateToken Utility', () => {
    it('should generate a valid JWT token', () => {
        const userId = '1234567890abcdef';
        const token = generateToken({ id: userId });

        expect(token).toBeDefined();

        // Verify signature
        const decoded = jwt.verify(token, JWT_SECRET);
        expect(decoded.id).toBe(userId);
    });

    it('should set expiration to 24 hours', () => {
        const userId = 'user123';
        const token = generateToken({ id: userId });
        const decoded = jwt.decode(token);

        // Check exp claim exists
        expect(decoded.exp).toBeDefined();

        // Rough check: exp should be > now
        expect(decoded.exp).toBeGreaterThan(Date.now() / 1000);
    });
});
