import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import AuthService from '../services/authService';

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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.group('AUTH STATE CHANGE');
      
      if (firebaseUser && isMounted) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (userDoc.exists() && isMounted) {
            setUser({
              _id: firebaseUser.uid,
              ...userDoc.data()
            });
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

  return (
    <AuthContext value={value}>
      {children}
    </AuthContext>
  );
}