import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import api from '../services/api.js';


export const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,
  login: async () => null,
  logout: () => {},
  register: async () => null,
  updateProfile: async () => null,
  setError: () => {}
});

export const AuthProvider = ({ children = null }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is already logged in (from localStorage token)
  useEffect(() => {
    let isMounted = true;
    const checkAuth = async () => {
      console.group('AUTH CHECK');
      console.log('Starting auth check');
      try {
        const token = localStorage.getItem('token');
        console.log('Token exists:', !!token);
        
        if (token) {
          // Set auth header
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          console.log('Set auth header');
          
          // Get user profile
          console.log('Fetching user profile...');
          const response = await api.get('/auth/profile');
          console.log('Profile response:', response.data);
          
          if (isMounted) {
            setUser(response.data);
            setIsAuthenticated(true);
          }
        } else {
          console.log('No token found');
        }
      } catch (error) {
        console.error('Authentication error:', error);
        console.error('Error details:', error.response?.data ?? error.message ?? 'Unknown error');
        localStorage.removeItem('token');
        if (isMounted) {
          setError('Session expired. Please log in again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
        console.log('Auth check complete');
        console.groupEnd();
      }
    };
    
    checkAuth();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, []);

  // Login function
  const login = useCallback(async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      console.log('Login attempt with:', email);
      
      const response = await api.post('/auth/login', { email, password });
      console.log('Login response received');
      const { token, ...userData } = response.data;
      
      // Set token in localStorage
      localStorage.setItem('token', token);
      console.log('Token stored in localStorage');
      
      // Set auth header
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(userData);
      setIsAuthenticated(true);
      
      return userData;
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error response:', error.response?.data ?? 'No response data');
      setError(error.response?.data?.message ?? 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  // Register function
  const register = useCallback(async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/auth/register', userData);
      const { token, ...newUser } = response.data;
      
      // Set token in localStorage
      localStorage.setItem('token', token);
      
      // Set auth header
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(newUser);
      setIsAuthenticated(true);
      
      return newUser;
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.response?.data?.message ?? 'Registration failed');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update user profile
  const updateProfile = useCallback(async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.put('/auth/profile', userData);
      setUser(prevUser => ({...prevUser, ...response.data}));
      
      return response.data;
    } catch (error) {
      console.error('Profile update error:', error);
      setError(error.response?.data?.message ?? 'Profile update failed');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    register,
    updateProfile,
    setError: (message) => setError(message)
  }), [user, isAuthenticated, loading, error, login, logout, register, updateProfile]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
