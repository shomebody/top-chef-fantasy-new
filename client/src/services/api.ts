// src/services/api.ts
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import axiosRetry from 'axios-retry';
import { getAuth } from 'firebase/auth';
import { logger, perfMonitor } from '../utils/debugUtils';

// Network error types for better debugging
export enum NetworkErrorType {
  TIMEOUT = 'TIMEOUT',
  NETWORK = 'NETWORK', 
  SERVER = 'SERVER',
  AUTH = 'AUTH',
  CLIENT = 'CLIENT',
  UNKNOWN = 'UNKNOWN'
}

export interface NetworkError extends Error {
  type: NetworkErrorType;
  status?: number;
  response?: any;
  isRetryable: boolean;
}

// Response structure with error handling
export interface ApiResponse<T = any> {
  data: T | null;
  error: NetworkError | null;
  status: number | null;
  isLoading: boolean;
}

// Create API instance with proper configuration
const createApiInstance = (config: AxiosRequestConfig = {}): AxiosInstance => {
  const instance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 15000, // 15 seconds
    ...config
  });
  
  // Add retry logic for network errors
  axiosRetry(instance, {
    retries: 3,
    retryDelay: (retryCount) => retryCount * 1000,
    retryCondition: (error) => {
      // Only retry on network errors, timeouts, and 5xx responses
      return axiosRetry.isNetworkOrIdempotentRequestError(error) || 
        error.code === 'ECONNABORTED' ||
        (error.response?.status && error.response.status >= 500);
    },
    onRetry: (retryCount, error, requestConfig) => {
      logger.warn(`Retrying request (${retryCount}/3)`, { 
        prefix: 'API',
        data: { 
          url: requestConfig.url,
          method: requestConfig.method,
          status: error.response?.status 
        }
      });
    }
  });
  
  // Request interceptor for adding Firebase auth token
  instance.interceptors.request.use(
    async (config) => {
      const requestId = Math.random().toString(36).substring(2, 9);
      
      // Start performance monitoring
      perfMonitor.start(`api-${requestId}`);
      
      logger.debug(`🔄 Request [${requestId}]: ${config.method?.toUpperCase()} ${config.url}`, {
        prefix: 'API',
        data: config.data
      });
      
      // Add request ID for tracking
      config.headers = config.headers || {};
      config.headers['X-Request-ID'] = requestId;
      
      // Add auth token if available
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (user) {
        try {
          // Get a fresh token
          const token = await user.getIdToken(true);
          config.headers['Authorization'] = `Bearer ${token}`;
        } catch (err) {
          logger.error('Error getting Firebase token:', { 
            prefix: 'API',
            data: err 
          });
        }
      }
      
      return config;
    },
    (error) => {
      logger.error('Request preparation error:', { 
        prefix: 'API',
        data: error 
      });
      return Promise.reject(formatApiError(error));
    }
  );
  
  // Response interceptor for handling errors
  instance.interceptors.response.use(
    (response) => {
      // Get request ID for logging
      const requestId = response.config.headers?.['X-Request-ID'];
      
      // End performance monitoring
      if (requestId) {
        perfMonitor.end(`api-${requestId}`);
      }
      
      logger.debug(`✅ Response [${requestId}]: ${response.status} ${response.config.url}`, {
        prefix: 'API',
        data: {
          status: response.status,
          data: response.data
        }
      });
      
      return response;
    },
    (error: AxiosError) => {
      // Get request ID for logging
      const requestId = error.config?.headers?.['X-Request-ID'];
      
      // End performance monitoring
      if (requestId) {
        perfMonitor.end(`api-${requestId}`);
      }
      
      logger.error(`❌ Error [${requestId}]: ${error.message}`, {
        prefix: 'API',
        data: {
          status: error.response?.status,
          method: error.config?.method,
          url: error.config?.url,
          data: error.response?.data
        }
      });
      
      // Format error for consistent handling
      const formattedError = formatApiError(error);
      
      // Handle auth errors (redirect to login)
      if (formattedError.type === NetworkErrorType.AUTH) {
        logger.warn('Authentication error - redirecting to login', {
          prefix: 'API'
        });
        
        // Delay redirect to avoid redirect loops
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      }
      
      return Promise.reject(formattedError);
    }
  );
  
  return instance;
};

// Format API errors for consistent handling
const formatApiError = (error: any): NetworkError => {
  const networkError: NetworkError = new Error(
    error.message || 'Unknown error occurred'
  ) as NetworkError;
  
  if (error.code === 'ECONNABORTED') {
    networkError.type = NetworkErrorType.TIMEOUT;
    networkError.isRetryable = true;
  } else if (error.message && error.message.includes('Network Error')) {
    networkError.type = NetworkErrorType.NETWORK;
    networkError.isRetryable = true;
  } else if (error.response) {
    // Server returned an error response
    networkError.status = error.response.status;
    networkError.response = error.response.data;
    
    if (error.response.status >= 500) {
      networkError.type = NetworkErrorType.SERVER;
      networkError.isRetryable = true;
    } else if (error.response.status === 401 || error.response.status === 403) {
      networkError.type = NetworkErrorType.AUTH;
      networkError.isRetryable = false;
    } else {
      networkError.type = NetworkErrorType.CLIENT;
      networkError.isRetryable = false;
    }
  } else {
    networkError.type = NetworkErrorType.UNKNOWN;
    networkError.isRetryable = false;
  }
  
  return networkError;
};

// Create default instance
const api = createApiInstance();

// Custom hook for making API requests with better error handling
export const useApi = <T = any>(initialData: T | null = null) => {
  const [state, setState] = React.useState<ApiResponse<T>>({
    data: initialData,
    error: null,
    status: null,
    isLoading: false
  });
  
  const request = React.useCallback(async (
    method: string,
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response: AxiosResponse<T> = await api.request({
        method,
        url,
        data,
        ...config
      });
      
      const result: ApiResponse<T> = {
        data: response.data,
        error: null,
        status: response.status,
        isLoading: false
      };
      
      setState(result);
      return result;
    } catch (err) {
      const error = err as NetworkError;
      
      const errorResult: ApiResponse<T> = {
        data: null,
        error,
        status: error.status || null,
        isLoading: false
      };
      
      setState(errorResult);
      return errorResult;
    }
  }, []);
  
  return {
    ...state,
    get: (url: string, config?: AxiosRequestConfig) => request('GET', url, undefined, config),
    post: (url: string, data?: any, config?: AxiosRequestConfig) => request('POST', url, data, config),
    put: (url: string, data?: any, config?: AxiosRequestConfig) => request('PUT', url, data, config),
    patch: (url: string, data?: any, config?: AxiosRequestConfig) => request('PATCH', url, data, config),
    delete: (url: string, config?: AxiosRequestConfig) => request('DELETE', url, undefined, config),
  };
};

export default api;