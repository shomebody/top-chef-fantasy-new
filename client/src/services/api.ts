// client/src/services/api.ts
import axios from 'axios';
import { getAuth } from 'firebase/auth';
import axiosRetry from 'axios-retry';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000
});

// Add retry logic for network errors
axiosRetry(api, {
  retries: 3,
  retryDelay: (retryCount) => retryCount * 1000,
  retryCondition: (error) => axiosRetry.isNetworkOrIdempotentRequestError(error),
});

// Request interceptor for adding Firebase auth token
api.interceptors.request.use(
  async (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (user) {
      try {
        // Get a fresh token
        const token = await user.getIdToken(true);
        config.headers['Authorization'] = `Bearer ${token}`;
        console.log('Added Firebase token to request');
      } catch (err) {
        console.error('Error getting Firebase token:', err);
      }
    } else {
      console.log('No authenticated user found');
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
    console.error('Response Error:', error.message);
    console.error('Status:', error.response?.status, 'Data:', error.response?.data);

    // Handle auth errors
    if (error.response?.status === 401) {
      console.log('Authentication error - redirecting to login');
      // Consider using React Router's navigate instead of direct window location change
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;