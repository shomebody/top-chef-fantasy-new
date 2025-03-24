import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import AuthService from '../services/authService';

export const AuthContext = React.createContext({
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

export function AuthProvider({ children }) {
  // States with proper initialization
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Monitor auth state
  useEffect(() => {
    let isMounted = true;
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.group('AUTH STATE CHANGE');
      
      if (firebaseUser && isMounted) {
        try {
          // Get user profile from Firestore
          const userData = await AuthService.getCurrentUser();
          
          if (isMounted) {
            setUser(userData);
            setIsAuthenticated(true);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          if (isMounted) {
            setError('Failed to load user profile');
          }
        }
      } else {
        if (isMounted) {
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      
      if (isMounted) {
        setLoading(false);
      }
      
      console.log('Auth state updated:', !!firebaseUser);
      console.groupEnd();
    });
    
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Login function
  const login = useCallback(async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const userData = await AuthService.login(email, password);
      setUser(userData);
      setIsAuthenticated(true);
      
      return userData;
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      await AuthService.logout();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
      setError(error.message || 'Logout failed');
    }
  }, []);

  // Register function
  const register = useCallback(async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const newUser = await AuthService.register(userData);
      setUser(newUser);
      setIsAuthenticated(true);
      
      return newUser;
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message || 'Registration failed');
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
      
      const updatedUser = await AuthService.updateProfile(userData);
      setUser(prev => ({...prev, ...updatedUser}));
      
      return updatedUser;
    } catch (error) {
      console.error('Profile update error:', error);
      setError(error.message || 'Profile update failed');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Memoize context value
 // Memoize value to prevent unnecessary re-renders
 const value = useMemo(() => ({
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

return <AuthContext>{value}{children}</AuthContext>;
}