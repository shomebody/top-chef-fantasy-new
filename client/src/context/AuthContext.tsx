import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  updateProfile as firebaseUpdateProfile,
  getAuth,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updatePassword
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { createContext, useCallback, useEffect, useState } from 'react';
import { db } from '../config/firebase';

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  isAdmin?: boolean;
  emailVerified?: boolean;
  avatar?: string;
}

export interface AuthContextProps {
  user: UserProfile | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<UserProfile | null>;
  logout: () => Promise<void>;
  register: (userData: { name: string; email: string; password: string }) => Promise<UserProfile | null>;
  updateProfile: (userData: { name?: string; email?: string; password?: string; currentPassword?: string; avatar?: string }) => Promise<UserProfile | null>;
  setError: (error: string | null) => void;
}

const auth = getAuth();
export const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const formatUserProfile = useCallback(async (firebaseUser: any): Promise<UserProfile> => {
    console.log('formatUserProfile started for user:', firebaseUser.uid);
    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      console.log('Firestore data fetched:', userDoc.data());
      
      // If user doc doesn't exist in Firestore, create it
      if (!userDoc.exists()) {
        console.log('User document not found, creating it');
        await setDoc(doc(db, 'users', firebaseUser.uid), {
          name: firebaseUser.displayName || 'User',
          email: firebaseUser.email || '',
          isAdmin: false,
          createdAt: new Date()
        });
      }
      
      const userData = userDoc.exists() ? userDoc.data() : {};
      
      const profile: UserProfile = {
        _id: firebaseUser.uid,
        name: userData?.name || firebaseUser.displayName || 'Unknown',
        email: firebaseUser.email || '',
        isAdmin: userData?.isAdmin || false,
        emailVerified: firebaseUser.emailVerified || false,
        avatar: firebaseUser.photoURL || userData?.avatar || '',
      };
      console.log('formatUserProfile completed:', profile);
      return profile;
    } catch (err) {
      console.error('Error formatting user profile:', err);
      // Return minimal profile on error
      return {
        _id: firebaseUser.uid,
        name: firebaseUser.displayName || 'Unknown',
        email: firebaseUser.email || '',
      };
    }
  }, []);

  useEffect(() => {
    console.log('AuthProvider effect running');
    console.log('Firebase auth initialized:', auth);
    setLoading(true);
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('onAuthStateChanged fired, firebaseUser:', firebaseUser?.uid || null);
      try {
        if (firebaseUser) {
          console.log('User detected, formatting profile');
          const userProfile = await formatUserProfile(firebaseUser);
          console.log('User profile set:', userProfile);
          setUser(userProfile);
          setIsAuthenticated(true);
        } else {
          console.log('No user detected');
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('Error in auth state change handler:', err);
        setError('Authentication error. Please try again later.');
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        console.log('Setting loading to false');
        setLoading(false);
      }
    }, (err) => {
      console.error('Auth state error:', err);
      setError('Auth failed: ' + err.message);
      setLoading(false);
    });
    
    console.log('AuthProvider effect subscribed');
    return () => {
      console.log('Unsubscribing auth listener');
      unsubscribe();
    };
  }, [formatUserProfile]);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      console.log('Login attempt:', { email });
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      const userProfile = await formatUserProfile(firebaseUser);
      setUser(userProfile);
      setIsAuthenticated(true);
      console.log('Login successful, user:', userProfile);
      return userProfile;
    } catch (err: any) {
      console.error('Login error:', err);
      // Provide more user-friendly error messages
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed login attempts. Please try again later.');
      } else {
        setError(err.message || 'Login failed');
      }
      return null;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
      setUser(null);
      setIsAuthenticated(false);
      console.log('Logout successful');
    } catch (err: any) {
      console.error('Logout error:', err);
      setError(err.message || 'Logout failed');
    }
  };

  const register = async (userData: { name: string; email: string; password: string }) => {
    try {
      setError(null);
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      const firebaseUser = userCredential.user;
      
      // Update display name in Firebase Auth
      await firebaseUpdateProfile(firebaseUser, {
        displayName: userData.name
      });
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        name: userData.name,
        email: userData.email.toLowerCase(),
        isAdmin: false,
        createdAt: new Date(),
        leagues: []
      });
      
      const userProfile = await formatUserProfile(firebaseUser);
      setUser(userProfile);
      setIsAuthenticated(true);
      console.log('Register successful, user:', userProfile);
      return userProfile;
    } catch (err: any) {
      console.error('Register error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please log in instead.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please use a stronger password.');
      } else {
        setError(err.message || 'Registration failed');
      }
      return null;
    }
  };

  const updateProfile = async (userData: { 
    name?: string; 
    email?: string; 
    password?: string; 
    currentPassword?: string;
    avatar?: string 
  }) => {
    try {
      setError(null);
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No user is logged in');
      }
      
      // Update profile fields that don't require reauthentication
      const updates: Record<string, any> = {};
      
      if (userData.name) {
        // Update display name in Firebase Auth
        await firebaseUpdateProfile(currentUser, {
          displayName: userData.name
        });
        updates.name = userData.name;
      }
      
      if (userData.avatar) {
        // Update photo URL in Firebase Auth
        await firebaseUpdateProfile(currentUser, {
          photoURL: userData.avatar
        });
        updates.avatar = userData.avatar;
      }
      
      // Handle password update if provided (requires reauthentication)
      if (userData.password && userData.currentPassword) {
        // Reauthenticate user before password change
        const credential = EmailAuthProvider.credential(
          currentUser.email || '', 
          userData.currentPassword
        );
        await reauthenticateWithCredential(currentUser, credential);
        await updatePassword(currentUser, userData.password);
      }
      
      // Update Firestore document if there are changes
      if (Object.keys(updates).length > 0) {
        await updateDoc(doc(db, 'users', currentUser.uid), updates);
      }
      
      // Get updated user profile
      const updatedProfile = await formatUserProfile(currentUser);
      setUser(updatedProfile);
      
      return updatedProfile;
    } catch (err: any) {
      console.error('Update profile error:', err);
      
      if (err.code === 'auth/requires-recent-login') {
        setError('This operation is sensitive and requires recent authentication. Please log in again.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Current password is incorrect.');
      } else {
        setError(err.message || 'Failed to update profile');
      }
      
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      loading, 
      error, 
      login, 
      logout, 
      register, 
      updateProfile, 
      setError 
    }}>
      {children}
    </AuthContext.Provider>
  );
};