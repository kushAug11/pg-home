import api from './api';

const housekeepingService = {
    // Owner: Get daily status
    getDailyStatus: async (date) => {
        const response = await api.get(`/housekeeping/daily?date=${date}`);
        return response.data;
    },

    // Owner: Log cleaning (update status)
    logCleaning: async (data) => {
        // data: { room_id, date, status, cleanedBy }
        const response = await api.post('/housekeeping/log', data);
        return response.data;
    }
};

export default housekeepingService;
