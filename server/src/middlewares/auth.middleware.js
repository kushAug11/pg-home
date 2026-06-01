const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../config/env');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, JWT_SECRET);
            const cacheKey = `session:${decoded.id}`;

            // Try Redis first
            const redis = require('../config/redis');
            let cachedUser = await redis.get(cacheKey);

            if (cachedUser) {
                req.user = cachedUser;
            } else {
                // Fallback to DB
                req.user = await User.findById(decoded.id).select('-password').lean(); // Use lean() for faster plain-object conversion
                
                if (!req.user) {
                    return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
                }

                // Block suspended/deactivated accounts
                if (['SUSPENDED', 'DEACTIVATED'].includes(req.user.accountStatus)) {
                    return res.status(403).json({ success: false, message: 'Account suspended or deactivated. Contact support.' });
                }
                
                // Save to cache for 1 hour (3600 seconds)
                await redis.setEx(cacheKey, 3600, req.user);
            }

            // Enforce password change for temp passwords
            if (req.user.mustChangePassword) {
                if (!req.originalUrl.includes('/api/auth/change-password') && !req.originalUrl.includes('/api/auth/logout')) {
                    return res.status(403).json({
                        success: false,
                        message: 'You must change your password before accessing the system.',
                        errorCode: 'MUST_CHANGE_PASSWORD'
                    });
                }
            }

            return next();
        } catch (error) {
            console.error(error);
            return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role ${req.user.role} is not authorized to access this route`
            });
        }
        next();
    };
};

module.exports = { protect, authorize };
