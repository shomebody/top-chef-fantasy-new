import axios from 'axios';
import axiosRetry from 'axios-retry';

// Create an axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api', // Updated fallback
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
  withCredentials: true, // Optional, for cookies/credentials
});

// Add retry logic for network errors
axiosRetry(api, {
  retries: 3,
  retryDelay: (retryCount) => retryCount * 1000,
  retryCondition: (error) => axiosRetry.isNetworkOrIdempotentRequestError(error),
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
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
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('Response Interceptor Error:', error);
    console.error('Status:', error.response?.status, 'Data:', error.response?.data);

    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      localStorage.removeItem('token');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    if (error.response?.status === 500) {
      console.error('Server Error Details:', error.response.data);
    }

    return Promise.reject(error);
  }
);

export default api;