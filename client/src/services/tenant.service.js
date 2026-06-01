import api from './api';

const tenantService = {
    getDashboard: async () => {
        const response = await api.get('/tenant/dashboard');
        return response.data;
    },

    getPayments: async () => {
        const response = await api.get('/tenant/payments');
        return response.data;
    },

    initiateRentPayment: async () => {
        const response = await api.post('/tenant/pay-rent');
        return response.data;
    },

    verifyPayment: async (paymentData) => {
        const response = await api.post('/tenant/verify-payment', paymentData);
        return response.data;
    },

    getComplaints: async () => {
        const response = await api.get('/tenant/complaints');
        return response.data;
    },

    raiseComplaint: async (complaintData) => {
        const response = await api.post('/tenant/complaints', complaintData);
        return response.data;
    },

    getNotices: async () => {
        const response = await api.get('/tenant/notices');
        return response.data;
    },

    requestExit: async (data) => {
        const response = await api.post('/tenant/request-exit', data);
        return response.data;
    },

    getPreAuthVisitors: async () => {
        const response = await api.get('/tenant/preauth-visitors');
        return response.data;
    },

    createPreAuthVisitor: async (visitorData) => {
        const response = await api.post('/tenant/preauth-visitors', visitorData);
        return response.data;
    }

};

export default tenantService;
