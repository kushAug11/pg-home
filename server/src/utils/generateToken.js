const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

const generateToken = (user) => {
    return jwt.sign({ 
        id: user._id || user.id, 
        pg_id: user.pg_id, 
        role: user.role 
    }, JWT_SECRET, {
        expiresIn: '24h',
    });
};

module.exports = generateToken;
