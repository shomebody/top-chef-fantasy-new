import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // Added for request timeout
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request Interceptor Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Response Interceptor Error:', error);

    const originalRequest = error.config;

    // Handle 401 Unauthorized - redirect to login
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Prevent infinite loop
      localStorage.removeItem('token');
      window.location.href = '/login';
      return Promise.reject(error); // Ensure error is still rejected after redirect
    }

    // Log additional details for 500 errors
    if (error.response?.status === 500) {
      console.error('Server Error Details:', error.response.data);
    }

    return Promise.reject(error);
  }
);

export default api;