// client/src/context/UserContext.tsx
import { createContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  isAdmin: boolean;
  leagues: string[];
  createdAt?: Date;
}

interface UserContextProps {
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  updateUserProfile: (userData: Partial<UserProfile>) => Promise<UserProfile>;
}

export const UserContext = createContext<UserContextProps>({
  userProfile: null,
  loading: true,
  error: null,
  updateUserProfile: async () => ({
    _id: '',
    name: '',
    email: '',
    isAdmin: false,
    leagues: []
  })
});

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    let unsubscribe = () => {};
    
    if (isAuthenticated && user?._id) {
      try {
        setLoading(true);
        console.log('Setting up user profile listener for:', user._id);
        const userRef = doc(db, 'users', user._id);
        
        unsubscribe = onSnapshot(userRef, (doc) => {
          if (doc.exists()) {
            const userData = doc.data();
            setUserProfile({
              _id: doc.id,
              name: userData.name || '',
              email: userData.email || '',
              avatar: userData.avatar || '',
              isAdmin: userData.isAdmin || false,
              leagues: userData.leagues || [],
              createdAt: userData.createdAt?.toDate() || new Date()
            });
            console.log('User profile updated from Firestore');
          } else {
            console.log('User document does not exist in Firestore');
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
      console.log('Cleaning up user profile listener');
      unsubscribe();
    };
  }, [isAuthenticated, user]);

  const updateUserProfile = useCallback(async (userData: Partial<UserProfile>): Promise<UserProfile> => {
    try {
      if (!isAuthenticated || !user?._id) {
        throw new Error('Not authenticated');
      }
      
      setLoading(true);
      console.log('Updating user profile:', userData);
      const userRef = doc(db, 'users', user._id);
      
      const updates: Record<string, any> = {};
      if (userData.name) updates.name = userData.name;
      if (userData.email) updates.email = userData.email.toLowerCase();
      if (userData.avatar) updates.avatar = userData.avatar;
      
      await updateDoc(userRef, updates);
      console.log('User profile updated in Firestore');
      
      if (userData.name && auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: userData.name
        });
        console.log('Auth profile display name updated');
      }
      
      if (!userProfile) {
        throw new Error('User profile not found');
      }
      
      const updatedProfile = {
        ...userProfile,
        ...updates
      };
      
      return updatedProfile;
    } catch (err) {
      console.error('Error updating user profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update user profile');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, userProfile]);

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
}