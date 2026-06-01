import api from './api';

const securityService = {
    // Visitor Logging
    logEntry: async (visitorData) => {
        const response = await api.post('/security/visitors', visitorData);
        return response.data;
    },
    getActiveVisitors: async () => {
        const response = await api.get('/security/visitors/active');
        return response.data;
    },
    markExit: async (id) => {
        const response = await api.put(`/security/visitors/${id}/exit`);
        return response.data;
    },

    // Guest Requests
    createGuestRequest: async (requestData) => {
        const response = await api.post('/security/guests', requestData);
        return response.data;
    },
    getMyRequests: async () => {
        const response = await api.get('/security/guests/my');
        return response.data;
    },
    getPendingRequests: async () => {
        const response = await api.get('/security/guests/pending');
        return response.data;
    },
    updateRequestStatus: async (id, status) => {
        const response = await api.put(`/security/guests/${id}/status`, { status });
        return response.data;
    },
    getPreAuthVisitors: async () => {
        const response = await api.get('/security/preauth-visitors');
        return response.data;
    },
    checkInPreAuthVisitor: async (qrCodeToken) => {
        const response = await api.post('/security/preauth-visitors/check-in', { qrCodeToken });
        return response.data;
    }
};

export default securityService;
