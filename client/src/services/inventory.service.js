import api from './api';

const inventoryService = {
    // Get all items
    getItems: async () => {
        const response = await api.get('/inventory');
        return response.data;
    },

    // Add new item
    addItem: async (data) => {
        const response = await api.post('/inventory', data);
        return response.data;
    },

    // Assign to room
    assignItem: async (data) => {
        const response = await api.post('/inventory/assign', data);
        return response.data;
    },

    // Return from room
    returnItem: async (data) => {
        const response = await api.post('/inventory/return', data);
        return response.data;
    }
};

export default inventoryService;
