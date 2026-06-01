import api from './api';

// Create a new axios instance for public requests if 'api' adds auth headers automatically
// Or just use 'api' and ensure the backend doesn't reject if no token (which we did by making routes public)
// However, our 'api' helper typically adds the token from localStorage. 
// For public routes, it shouldn't matter if an invalid token is sent, as long as the backend doesn't enforce auth.

const publicService = {
    // Get Public PG Details
    getPGDetails: async (id) => {
        const response = await api.get(`/public/pg/${id}`);
        return response.data;
    },

    // Submit Visit Request
    submitVisitRequest: async (data) => {
        const response = await api.post('/public/visit', data);
        return response.data;
    }
};

export default publicService;
