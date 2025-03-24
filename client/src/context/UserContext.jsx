// client/src/context/UserContext.jsx
import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { useAuth } from '../hooks/useAuth.jsx';

export const UserContext = createContext({
  userProfile: null,
  loading: true,
  error: null,
  updateUserProfile: async () => ({})
});

export const UserProvider = ({ children }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    let unsubscribe = () => {};
    
    if (isAuthenticated && user?._id) {
      try {
        setLoading(true);
        const userRef = doc(db, 'users', user._id);
        
        unsubscribe = onSnapshot(userRef, (doc) => {
          if (doc.exists()) {
            setUserProfile({
              _id: doc.id,
              ...doc.data()
            });
          } else {
            setUserProfile(null);
          }
          setLoading(false);
        }, (err) => {
          console.error('Error in user profile snapshot:', err);
          setError('Failed to load user profile');
          setLoading(false);
        });
      } catch (err) {
        console.error('Error setting up user profile listener:', err);
        setError('Failed to load user profile');
        setLoading(false);
      }
    } else {
      setUserProfile(null);
      setLoading(false);
    }
    
    return () => {
      unsubscribe();
    };
  }, [isAuthenticated, user]);

  const updateUserProfile = useCallback(async (userData) => {
    try {
      if (!isAuthenticated || !user?._id) {
        throw new Error('Not authenticated');
      }
      
      setLoading(true);
      const userRef = doc(db, 'users', user._id);
      
      const updates = {};
      if (userData.name) updates.name = userData.name;
      if (userData.email) updates.email = userData.email.toLowerCase();
      if (userData.avatar) updates.avatar = userData.avatar;
      
      await updateDoc(userRef, updates);
      
      if (userData.name && auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: userData.name
        });
      }
      
      return {
        _id: user._id,
        ...updates
      };
    } catch (err) {
      console.error('Error updating user profile:', err);
      setError('Failed to update user profile');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const value = useMemo(() => ({
    userProfile,
    loading,
    error,
    updateUserProfile
  }), [userProfile, loading, error, updateUserProfile]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};