import api from './api';

const ownerService = {
    // Rooms
    getRooms: async () => {
        const response = await api.get('/owner/rooms');
        return response.data;
    },

    createRoom: async (roomData) => {
        const response = await api.post('/owner/rooms', roomData);
        return response.data;
    },

    updateRoom: async (id, roomData) => {
        const response = await api.put(`/owner/rooms/${id}`, roomData);
        return response.data;
    },

    deleteRoom: async (id) => {
        const response = await api.delete(`/owner/rooms/${id}`);
        return response.data;
    },

    // Tenants
    getTenants: async () => {
        const response = await api.get('/owner/tenants');
        return response.data;
    },

    addTenant: async (tenantData) => {
        // If tenantData is FormData, let axios set Content-Type
        const config = tenantData instanceof FormData
            ? { headers: { 'Content-Type': 'multipart/form-data' } }
            : {};

        const response = await api.post('/owner/tenants', tenantData, config);
        return response.data;
    },

    bulkAddTenants: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/owner/tenants/bulk', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    updateTenant: async (id, tenantData) => {
        const config = tenantData instanceof FormData
            ? { headers: { 'Content-Type': 'multipart/form-data' } }
            : {};
        const response = await api.put(`/owner/tenants/${id}`, tenantData, config);
        return response.data;
    },

    deleteTenant: async (id) => {
        const response = await api.delete(`/owner/tenants/${id}`);
        return response.data;
    },

    // Complaints
    getComplaints: async () => {
        const response = await api.get('/owner/complaints');
        return response.data;
    },

    updateComplaintStatus: async (id, statusData) => {
        const response = await api.put(`/owner/complaints/${id}`, statusData);
        return response.data;
    },

    // Notices
    getNotices: async () => {
        const response = await api.get('/owner/notices');
        return response.data;
    },

    createNotice: async (noticeData) => {
        const response = await api.post('/owner/notices', noticeData);
        return response.data;
    },

    deleteNotice: async (id) => {
        const response = await api.delete(`/owner/notices/${id}`);
        return response.data;
    },

    // Expenses & Analytics
    getExpenses: async () => {
        const response = await api.get('/owner/expenses');
        return response.data;
    },

    addExpense: async (expenseData) => {
        const response = await api.post('/owner/expenses', expenseData);
        return response.data;
    },

    deleteExpense: async (id) => {
        const response = await api.delete(`/owner/expenses/${id}`);
        return response.data;
    },

    getAnalytics: async () => {
        const response = await api.get('/owner/analytics');
        return response.data;
    },

    getDashboardStats: async () => {
        const response = await api.get('/owner/dashboard-stats');
        return response.data;
    },

    getFinancialReport: async () => {
        const response = await api.get('/owner/analytics/export', { responseType: 'blob' });
        return response.data;
    },

    // Payments (Manual)
    getPayments: async () => {
        const response = await api.get('/owner/payments');
        return response.data;
    },

    recordManualPayment: async (paymentData) => {
        const response = await api.post('/payments/manual', paymentData);
        return response.data;
    },

    checkCompatibility: async (roomId, preferences) => {
        const response = await api.post(`/owner/rooms/${roomId}/compatibility`, preferences);
        return response.data;
    },

    manageExitRequest: async (data) => {
        const response = await api.post('/owner/tenants/exit-request', data);
        return response.data;
    },
    // Visit Requests
    getVisitRequests: async () => {
        const response = await api.get('/visits');
        return response.data;
    },

    updateVisitStatus: async (id, data) => {
        const response = await api.put(`/visits/${id}`, data);
        return response.data;
    }
};


export default ownerService;
