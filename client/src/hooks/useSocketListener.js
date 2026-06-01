import { useEffect } from 'react';
import { getSocket } from '../services/socket.service';

/**
 * Hook to listen to a specific socket event
 * @param {string} eventName - The event name to listen for (e.g. 'payment:received')
 * @param {function} callback - The function to call when event triggers
 */
export const useSocketListener = (eventName, callback) => {
    useEffect(() => {
        const socket = getSocket();
        if (!socket) return;

        socket.on(eventName, callback);

        return () => {
            socket.off(eventName, callback);
        };
    }, [eventName, callback]);
};
