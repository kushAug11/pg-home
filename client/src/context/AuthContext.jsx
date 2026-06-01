import { createContext, useState, useEffect, useContext } from 'react';
import authService from '../services/auth.service';

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const initSocketClient = async (token) => {
        const { initSocket } = await import('../services/socket.service');
        initSocket(token);
    };

    const disconnectSocketClient = async () => {
        const { disconnectSocket } = await import('../services/socket.service');
        disconnectSocket();
    };


    useEffect(() => {
        const checkUser = async () => {
            try {
                const storedToken = localStorage.getItem('token');
                if (storedToken) {
                    // Verify token by fetching current user
                    const response = await authService.getCurrentUser();
                    if (response.success) {
                        setUser(response.data);
                        await initSocketClient(storedToken);
                    } else {
                        localStorage.removeItem('token');
                    }
                }
            } catch (err) {
                console.error("Session verification failed", err);
                localStorage.removeItem('token');
            } finally {
                setLoading(false);
            }
        };
        checkUser();
    }, []);

    const login = async (email, password) => {
        try {
            const response = await authService.login(email, password);
            // Login returns { success: true, data: { ...user, token } }
            if (response.success) {
                setUser(response.data);
                await initSocketClient(response.data.token);
                return { success: true, role: response.data.role };
            }
            return { success: false, message: response.message };
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.message ||
                (error.code === 'ERR_NETWORK' ? 'Server Offline. Run "npm run dev" in server folder.' : error.message || 'Login failed');
            return { success: false, message: msg };
        }
    };

    const logout = () => {
        authService.logout();
        setUser(null);
        disconnectSocketClient();
    };

    const registerOwner = async (name, email, password, pgName) => {
        try {
            const response = await authService.registerOwner(name, email, password, pgName);
            if (response.success) {
                setUser(response.data);
                await initSocketClient(response.data.token);
                return { success: true };
            }
            return { success: false, message: response.message };
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.message ||
                (error.code === 'ERR_NETWORK' ? 'Server Offline. Run "npm run dev" in server folder.' : error.message || 'Registration failed');
            return { success: false, message: msg };
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, registerOwner, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
