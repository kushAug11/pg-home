import api from './api';

const messService = {
    // Owner
    updateMenu: async (date, meals) => {
        const response = await api.post('/mess/menu', { date, meals });
        return response.data;
    },
    getAnalytics: async (date) => {
        const response = await api.get(`/mess/analytics?date=${date}`);
        return response.data;
    },

    // Shared
    getMenu: async (params) => {
        let queryString = '';
        if (typeof params === 'object') {
            const searchParams = new URLSearchParams(params);
            queryString = `?${searchParams.toString()}`;
        } else {
            queryString = `?date=${params}`;
        }
        const response = await api.get(`/mess/menu${queryString}`);
        return response.data;
    },

    // Tenant
    markAttendance: async (date, meal_type, status) => {
        const response = await api.post('/mess/attendance', { date, meal_type, status });
        return response.data;
    },

    // Meal Vouchers
    purchaseVoucher: async (voucherData) => {
        const response = await api.post('/mess/vouchers', voucherData);
        return response.data;
    },
    getMyVouchers: async () => {
        const response = await api.get('/mess/vouchers/my');
        return response.data;
    },
    getVouchersList: async () => {
        const response = await api.get('/mess/vouchers');
        return response.data;
    },
    verifyVoucher: async (voucherCode) => {
        const response = await api.post('/mess/vouchers/verify', { voucherCode });
        return response.data;
    }
};

export default messService;
