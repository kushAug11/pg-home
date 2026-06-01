import api from './api';

const adminService = {
    getStats: async () => {
        const response = await api.get('/admin/stats');
        return response.data;
    },

    getAllPGs: async (params = {}) => {
        const response = await api.get('/admin/pgs', { params });
        return response.data;
    },

    deletePG: async (id) => {
        const response = await api.delete(`/admin/pgs/${id}`);
        return response.data;
    },

    getAuditLogs: async (params = {}) => {
        const response = await api.get('/admin/audit-logs', { params });
        return response.data;
    },

    triggerBackup: async () => {
        const response = await api.post('/admin/backups');
        return response.data;
    },

    getBackups: async () => {
        const response = await api.get('/admin/backups');
        return response.data;
    }
};

export default adminService;
