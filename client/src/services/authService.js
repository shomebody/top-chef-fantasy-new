import api from './api.js';

// Handle token management
export const getToken = () => localStorage.getItem('token');
export const setToken = (token) => localStorage.setItem('token', token);
export const removeToken = () => localStorage.removeItem('token');

// Auth service functions
const AuthService = {
  // Register a new user
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.data.token) {
      setToken(response.data.token);
    }
    return response.data;
  }
  
  // Login user
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      setToken(response.data.token);
    }
    return response.data;
  }
  
  // Logout user
  logout: () => {
    removeToken();
  }
  
  // Get current user profile
  getCurrentUser: async () => {
    return await api.get('/auth/profile');
  }
  
  // Update user profile
  updateProfile: async (userData) => {
    return await api.put('/auth/profile', userData);
  }
  
  // Check if user is authenticated
  isAuthenticated: () => {
    return !!getToken();
  }
};

export default AuthService;
