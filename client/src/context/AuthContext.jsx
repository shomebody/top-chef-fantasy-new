import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

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
      } else if (isMounted) {
        setUser(null);
        setIsAuthenticated(false);
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
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const user = {
          _id: userCredential.user.uid,
          name: userData.name,
          email: userData.email,
          isAdmin: userData.isAdmin || false
        };
        
        setUser(user);
        setIsAuthenticated(true);
        
        return user;
      } else {
        throw new Error('User profile not found');
      }
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
      await signOut(auth);
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
      
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        userData.email, 
        userData.password
      );
      
      await updateProfile(userCredential.user, {
        displayName: userData.name
      });
      
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name: userData.name,
        email: userData.email,
        avatar: '',
        isAdmin: false,
        leagues: [],
        createdAt: new Date().toISOString()
      });
      
      const newUser = {
        _id: userCredential.user.uid,
        name: userData.name,
        email: userData.email,
        isAdmin: false
      };
      
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

  const updateUserProfile = useCallback(async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('No user logged in');
      
      const userRef = doc(db, 'users', currentUser.uid);
      
      const updateData = {};
      if (userData.name) updateData.name = userData.name;
      if (userData.email) updateData.email = userData.email;
      if (userData.avatar) updateData.avatar = userData.avatar;
      
      if (Object.keys(updateData).length > 0) {
        await updateDoc(userRef, updateData);
        
        if (userData.name) {
          await updateProfile(currentUser, {
            displayName: userData.name
          });
        }
      }
      
      setUser(prev => ({
        ...prev,
        ...updateData
      }));
      
      return {
        _id: currentUser.uid,
        ...updateData
      };
    } catch (error) {
      console.error('Update profile error:', error);
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
    updateProfile: updateUserProfile,
    setError: (message) => setError(message)
  }), [user, isAuthenticated, loading, error, login, logout, register, updateUserProfile]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}