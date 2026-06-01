import io from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'; // Adjust as needed
// Note: Socket.io client usually parses URL automatically if not provided, but explicit is better.
// Vite env vars need valid URL. If API_URL includes /api, we might need to strip it or socket automatically handles base.

/**
 * Singleton Socket Instance
 * Stores the active socket connection to prevent multiple connections.
 */
let socket;

/**
 * Initialize Socket Connection
 * Establishes a WebSocket connection to the server using the provided auth token.
 * Validates if a connection already exists to enforce singleton pattern.
 * 
 * @param {string} token - JWT Auth token for authentication handshake
 * @returns {Socket} The active socket.io client instance
 */
export const initSocket = (token) => {
    if (socket) return socket;

    // Strip '/api' if present in VITE_API_URL for socket connection base
    // Socket.io connects to the root URL, not the API namespace by default unless configured
    const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace('/api', '');

    socket = io(baseUrl, {
        auth: { token },
        transports: ['websocket'] // Force websocket for performance and to avoid polling lag
    });

    socket.on('connect', () => {
        console.log('✅ Socket Context Connected');
    });

    socket.on('connect_error', (err) => {
        console.error('❌ Socket Connection Error:', err.message);
    });

    return socket;
};

/**
 * Get Active Socket Instance
 * Useful for components that need to emit events but don't want to re-initialize.
 * 
 * @returns {Socket|null} The current socket instance or null if not connected
 */
export const getSocket = () => socket;

/**
 * Disconnect Socket
 * clean up the connection when user logs out or app unmounts.
 */
export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
