// client/src/context/AuthContext.tsx
import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { 
  User as FirebaseUser,
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile as firebaseUpdateProfile,
  onAuthStateChanged,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  applyActionCode,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  emailVerified: boolean;
  avatar?: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface UpdateProfileData {
  name?: string;
  email?: string;
  password?: string;
  currentPassword?: string;
  avatar?: string;
}

export interface AuthContextProps {
  user: UserProfile | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<UserProfile | null>;
  logout: () => Promise<void>;
  register: (userData: RegisterData) => Promise<UserProfile | null>;
  updateProfile: (userData: UpdateProfileData) => Promise<UserProfile | null>;
  resetPassword: (email: string) => Promise<boolean>;
  sendVerificationEmail: () => Promise<boolean>;
  verifyEmail: (actionCode: string) => Promise<boolean>;
  setError: (error: string | null) => void;
}

export const AuthContext = createContext<AuthContextProps>({
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,
  login: async () => null,
  logout: async () => {},
  register: async () => null,
  updateProfile: async () => null,
  resetPassword: async () => false,
  sendVerificationEmail: async () => false,
  verifyEmail: async () => false,
  setError: () => {}
});

const mapFirebaseError = (error: any): string => {
  const errorCode = error.code || '';
  const errorMessage = error.message || 'An unknown error occurred';
  switch (errorCode) {
    case 'auth/invalid-email': return 'Invalid email address format';
    case 'auth/user-disabled': return 'This account has been disabled';
    case 'auth/user-not-found': return 'No account found with this email';
    case 'auth/wrong-password': return 'Incorrect password';
    case 'auth/email-already-in-use': return 'Email already in use';
    case 'auth/weak-password': return 'Password is too weak';
    case 'auth/operation-not-allowed': return 'Operation not allowed';
    case 'auth/requires-recent-login': return 'Please log in again before retrying this request';
    case 'auth/too-many-requests': return 'Too many unsuccessful login attempts. Please try again later';
    case 'auth/network-request-failed': return 'Network error. Please check your connection';
    default: return errorMessage;
  }
};

const formatUserProfile = async (firebaseUser: FirebaseUser): Promise<UserProfile> => {
  console.log('formatUserProfile started for user:', firebaseUser.uid);
  let userData: any = {};
  try {
    console.log('Fetching Firestore doc for user:', firebaseUser.uid);
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    if (userDoc.exists()) {
      userData = userDoc.data();
      console.log('Firestore data fetched:', userData);
    } else {
      console.log('No Firestore data for user:', firebaseUser.uid);
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
  }
  const profile = {
    _id: firebaseUser.uid,
    name: userData.name || firebaseUser.displayName || '',
    email: userData.email || firebaseUser.email || '',
    isAdmin: userData.isAdmin || false,
    emailVerified: firebaseUser.emailVerified,
    avatar: userData.avatar || firebaseUser.photoURL || ''
  };
  console.log('formatUserProfile completed:', profile);
  return profile;
};

export function AuthProvider({ children }: { children: React.ReactNode }): React.ReactNode {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('AuthProvider effect running');
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('onAuthStateChanged fired, firebaseUser:', firebaseUser ? firebaseUser.uid : 'null');
      setLoading(true);
      console.log('Set loading to true');
      try {
        if (firebaseUser) {
          console.log('User detected, formatting profile');
          const userProfile = await formatUserProfile(firebaseUser);
          console.log('Setting user:', userProfile);
          setUser(userProfile);
          console.log('Setting isAuthenticated to true');
          setIsAuthenticated(true);
        } else {
          console.log('No user, clearing state');
          setUser(null);
          console.log('Setting isAuthenticated to false');
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('Auth state change error:', err);
        setError(mapFirebaseError(err));
      } finally {
        console.log('Finally block: Setting loading to false');
        setLoading(false);
      }
    });
    console.log('AuthProvider effect subscribed');
    return () => {
      console.log('Unsubscribing auth listener');
      unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<UserProfile | null> => {
    console.log('Login called with:', email);
    try {
      setLoading(true);
      console.log('Set loading to true for login');
      setError(null);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('User signed in:', userCredential.user.uid);
      const userProfile = await formatUserProfile(userCredential.user);
      console.log('Login successful:', userProfile);
      return userProfile;
    } catch (err) {
      console.error('Login error:', err);
      setError(mapFirebaseError(err));
      return null;
    } finally {
      console.log('Login finally: Setting loading to false');
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (userData: RegisterData): Promise<UserProfile | null> => {
    console.log('Register called with:', userData.email);
    try {
      setLoading(true);
      console.log('Set loading to true for register');
      setError(null);
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      console.log('User created:', userCredential.user.uid);
      await firebaseUpdateProfile(userCredential.user, { displayName: userData.name });
      console.log('Profile updated with name');
      await sendEmailVerification(userCredential.user);
      console.log('Verification email sent');
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name: userData.name,
        email: userData.email,
        isAdmin: false,
        leagues: [],
        createdAt: serverTimestamp()
      });
      console.log('Firestore user doc set');
      const userProfile = await formatUserProfile(userCredential.user);
      console.log('Register successful:', userProfile);
      return userProfile;
    } catch (err) {
      console.error('Registration error:', err);
      setError(mapFirebaseError(err));
      return null;
    } finally {
      console.log('Register finally: Setting loading to false');
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    console.log('Logout called');
    try {
      setLoading(true);
      console.log('Set loading to true for logout');
      await signOut(auth);
      console.log('User signed out');
    } catch (err) {
      console.error('Logout error:', err);
      setError(mapFirebaseError(err));
    } finally {
      console.log('Logout finally: Setting loading to false');
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (userData: UpdateProfileData): Promise<UserProfile | null> => {
    console.log('UpdateProfile called with:', userData);
    try {
      setLoading(true);
      console.log('Set loading to true for updateProfile');
      setError(null);
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No user logged in');
      }
      if (userData.password && userData.currentPassword) {
        const credential = EmailAuthProvider.credential(currentUser.email || '', userData.currentPassword);
        await reauthenticateWithCredential(currentUser, credential);
        console.log('User reauthenticated');
        await updatePassword(currentUser, userData.password);
        console.log('Password updated');
      }
      const updates: Record<string, any> = {};
      if (userData.name) {
        await firebaseUpdateProfile(currentUser, { displayName: userData.name });
        updates.name = userData.name;
        console.log('Name updated');
      }
      if (userData.avatar) {
        await firebaseUpdateProfile(currentUser, { photoURL: userData.avatar });
        updates.avatar = userData.avatar;
        console.log('Avatar updated');
      }
      if (Object.keys(updates).length > 0) {
        await updateDoc(doc(db, 'users', currentUser.uid), updates);
        console.log('Firestore doc updated');
      }
      const updatedUser = await formatUserProfile(currentUser);
      console.log('Profile update successful:', updatedUser);
      setUser(updatedUser);
      return updatedUser;
    } catch (err) {
      console.error('Update profile error:', err);
      setError(mapFirebaseError(err));
      return null;
    } finally {
      console.log('UpdateProfile finally: Setting loading to false');
      setLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<boolean> => {
    console.log('ResetPassword called with:', email);
    try {
      setLoading(true);
      console.log('Set loading to true for resetPassword');
      setError(null);
      await sendPasswordResetEmail(auth, email);
      console.log('Password reset email sent');
      return true;
    } catch (err) {
      console.error('Reset password error:', err);
      setError(mapFirebaseError(err));
      return false;
    } finally {
      console.log('ResetPassword finally: Setting loading to false');
      setLoading(false);
    }
  }, []);

  const sendVerificationEmail = useCallback(async (): Promise<boolean> => {
    console.log('SendVerificationEmail called');
    try {
      setLoading(true);
      console.log('Set loading to true for sendVerificationEmail');
      setError(null);
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No user logged in');
      }
      await sendEmailVerification(currentUser);
      console.log('Verification email sent');
      return true;
    } catch (err) {
      console.error('Send verification email error:', err);
      setError(mapFirebaseError(err));
      return false;
    } finally {
      console.log('SendVerificationEmail finally: Setting loading to false');
      setLoading(false);
    }
  }, []);

  const verifyEmail = useCallback(async (actionCode: string): Promise<boolean> => {
    console.log('VerifyEmail called with actionCode:', actionCode);
    try {
      setLoading(true);
      console.log('Set loading to true for verifyEmail');
      setError(null);
      await applyActionCode(auth, actionCode);
      console.log('Email verification code applied');
      if (auth.currentUser) {
        const userProfile = await formatUserProfile(auth.currentUser);
        console.log('User profile refreshed:', userProfile);
        setUser(userProfile);
      }
      console.log('Email verification successful');
      return true;
    } catch (err) {
      console.error('Verify email error:', err);
      setError(mapFirebaseError(err));
      return false;
    } finally {
      console.log('VerifyEmail finally: Setting loading to false');
      setLoading(false);
    }
  }, []);

  const contextValue = useMemo(() => ({
    user,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    register,
    updateProfile,
    resetPassword,
    sendVerificationEmail,
    verifyEmail,
    setError
  }), [user, isAuthenticated, loading, error, login, logout, register, updateProfile, resetPassword, sendVerificationEmail, verifyEmail]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}