const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

let io;

/**
 * Initialize Socket.io Server
 * @param {object} httpServer - The HTTP server instance from app.listen
 */
const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: '*', // Adjust for production
            methods: ['GET', 'POST']
        }
    });

    // Authentication Middleware
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) return next(new Error('Authentication error: No token'));

        jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) return next(new Error('Authentication error: Invalid token'));
            socket.user = decoded; // { id: '...', role: '...' }
            next();
        });
    });

    io.on('connection', (socket) => {
        console.log(`🔌 Socket Connected: ${socket.user.id} (${socket.user.role})`);

        // Join User Room (for direct notifications)
        socket.join(`user_${socket.user.id}`);

        // Join PG Room (if Owner or Tenant)
        if (socket.user.pg_id) {
            console.log(`🏢 User ${socket.user.id} joining room: pg_${socket.user.pg_id}`);
            socket.join(`pg_${socket.user.pg_id}`);
        }

        socket.on('disconnect', () => {
            console.log(`❌ Socket Disconnected: ${socket.user.id}`);
        });
    });

    return io;
};

/**
 * Get Socket.io Instance
 */
const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

module.exports = { initSocket, getIO };
