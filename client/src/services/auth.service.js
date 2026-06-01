import api from './api';

const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.success && response.data.data && response.data.data.token) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data)); // Optional persistence
    }
    return response.data;
  },

  registerOwner: async (name, email, password, pgName) => {
    const response = await api.post('/auth/register', {
      name,
      email,
      password,
      pgName,
      role: 'owner'
    });
    if (response.data.success && response.data.data && response.data.data.token) {
      localStorage.setItem('token', response.data.data.token);
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  setupAccount: async (token, password) => {
    const response = await api.post('/auth/setup-account', { token, password });
    if (response.data.success && response.data.data && response.data.data.token) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data));
    }
    return response.data;
  }
};

export default authService;
