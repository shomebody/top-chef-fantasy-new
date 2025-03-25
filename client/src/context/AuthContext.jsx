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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (userDoc.exists()) {
            setUser({
              _id: firebaseUser.uid,
              ...userDoc.data(),
              emailVerified: firebaseUser.emailVerified
            });
            setIsAuthenticated(true);
          } else {
            // User exists in Firebase Auth but not in Firestore
            console.warn('User document not found in Firestore');
            setUser({
              _id: firebaseUser.uid,
              name: firebaseUser.displayName || '',
              email: firebaseUser.email || '',
              emailVerified: firebaseUser.emailVerified
            });
            setIsAuthenticated(true);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setError('Failed to load user profile');
          setIsAuthenticated(false);
          setUser(null);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const user = await AuthService.login(email, password);
      return user;
    } catch (error) {
      console.error('Login error:', error);
      setError(mapAuthErrorToMessage(error));
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await AuthService.logout();
    } catch (error) {
      console.error('Logout error:', error);
      setError(mapAuthErrorToMessage(error));
    }
  }, []);

  const register = useCallback(async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const user = await AuthService.register(userData);
      return user;
    } catch (error) {
      console.error('Registration error:', error);
      setError(mapAuthErrorToMessage(error));
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
      
      setUser(prev => ({
        ...prev,
        ...updatedUser
      }));
      
      return updatedUser;
    } catch (error) {
      console.error('Update profile error:', error);
      setError(mapAuthErrorToMessage(error));
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Map Firebase auth errors to user-friendly messages
  const mapAuthErrorToMessage = (error) => {
    const errorCode = error.code;
    switch (errorCode) {
      case 'auth/invalid-email':
        return 'Invalid email address format';
      case 'auth/user-disabled':
        return 'This account has been disabled';
      case 'auth/user-not-found':
        return 'No account found with this email';
      case 'auth/wrong-password':
        return 'Incorrect password';
      case 'auth/email-already-in-use':
        return 'Email already in use';
      case 'auth/weak-password':
        return 'Password is too weak';
      case 'auth/operation-not-allowed':
        return 'Operation not allowed';
      case 'auth/account-exists-with-different-credential':
        return 'An account already exists with the same email address but different sign-in credentials';
      case 'auth/popup-closed-by-user':
        return 'Sign-in popup was closed before completing the sign-in';
      default:
        return error.message || 'Authentication failed';
    }
  };

  const value = useMemo(() => ({
    user,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    register,
    updateProfile,
    setError
  }), [user, isAuthenticated, loading, error, login, logout, register, updateProfile]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}