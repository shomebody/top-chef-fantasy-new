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

/**
 * User profile interface extending Firebase User data with app-specific fields
 */
export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  emailVerified: boolean;
  avatar?: string;
}

/**
 * Data required for user registration
 */
export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

/**
 * Data for updating user profile
 */
export interface UpdateProfileData {
  name?: string;
  email?: string;
  password?: string;
  currentPassword?: string;
  avatar?: string;
}

/**
 * Authentication context interface defining all auth-related functionality
 */
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

// Create context with default values
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

/**
 * Maps Firebase auth errors to user-friendly messages
 */
const mapFirebaseError = (error: any): string => {
  const errorCode = error.code || '';
  const errorMessage = error.message || 'An unknown error occurred';
  
  // Common Firebase error codes
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
    case 'auth/requires-recent-login':
      return 'Please log in again before retrying this request';
    case 'auth/too-many-requests':
      return 'Too many unsuccessful login attempts. Please try again later';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection';
    default:
      return errorMessage;
  }
};

/**
 * Converts Firebase user data to UserProfile format
 */
const formatUserProfile = async (firebaseUser: FirebaseUser): Promise<UserProfile> => {
  // Get additional user data from Firestore
  let userData: any = {};
  try {
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    if (userDoc.exists()) {
      userData = userDoc.data();
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
  }
  
  return {
    _id: firebaseUser.uid,
    name: userData.name || firebaseUser.displayName || '',
    email: userData.email || firebaseUser.email || '',
    isAdmin: userData.isAdmin || false,
    emailVerified: firebaseUser.emailVerified,
    avatar: userData.avatar || firebaseUser.photoURL || ''
  };
};

export function AuthProvider({ children }: { children: React.ReactNode }): React.ReactNode {  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      
      try {
        if (firebaseUser) {
          const userProfile = await formatUserProfile(firebaseUser);
          setUser(userProfile);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('Auth state change error:', err);
        setError(mapFirebaseError(err));
      } finally {
        setLoading(false);
      }
    });
    
    // Cleanup function
    return () => unsubscribe();
  }, []);

  /**
   * Log in user with email and password
   */
  const login = useCallback(async (email: string, password: string): Promise<UserProfile | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userProfile = await formatUserProfile(userCredential.user);
      
      return userProfile;
    } catch (err) {
      console.error('Login error:', err);
      setError(mapFirebaseError(err));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Register new user with email and password
   */
  const register = useCallback(async (userData: RegisterData): Promise<UserProfile | null> => {
    try {
      setLoading(true);
      setError(null);
      
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        userData.email, 
        userData.password
      );
      
      // Update display name
      await firebaseUpdateProfile(userCredential.user, {
        displayName: userData.name
      });
      
      // Optional: Send email verification
      await sendEmailVerification(userCredential.user);
      
      // Store additional user data in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name: userData.name,
        email: userData.email,
        isAdmin: false,
        leagues: [],
        createdAt: serverTimestamp()
      });
      
      const userProfile = await formatUserProfile(userCredential.user);
      return userProfile;
    } catch (err) {
      console.error('Registration error:', err);
      setError(mapFirebaseError(err));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Log out current user
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      await signOut(auth);
    } catch (err) {
      console.error('Logout error:', err);
      setError(mapFirebaseError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update user profile information
   */
  const updateProfile = useCallback(async (userData: UpdateProfileData): Promise<UserProfile | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No user logged in');
      }
      
      // If updating password, need to reauthenticate first
      if (userData.password && userData.currentPassword) {
        const credential = EmailAuthProvider.credential(
          currentUser.email || '',
          userData.currentPassword
        );
        
        await reauthenticateWithCredential(currentUser, credential);
        await updatePassword(currentUser, userData.password);
      }
      
      const updates: Record<string, any> = {};
      
      // Update name in Firebase Auth and Firestore
      if (userData.name) {
        await firebaseUpdateProfile(currentUser, {
          displayName: userData.name
        });
        updates.name = userData.name;
      }
      
      // Update avatar if provided
      if (userData.avatar) {
        await firebaseUpdateProfile(currentUser, {
          photoURL: userData.avatar
        });
        updates.avatar = userData.avatar;
      }
      
      // Update Firestore document if changes
      if (Object.keys(updates).length > 0) {
        await updateDoc(doc(db, 'users', currentUser.uid), updates);
      }
      
      // Return updated user profile
      const updatedUser = await formatUserProfile(currentUser);
      setUser(updatedUser);
      
      return updatedUser;
    } catch (err) {
      console.error('Update profile error:', err);
      setError(mapFirebaseError(err));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Send password reset email to specified address
   */
  const resetPassword = useCallback(async (email: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (err) {
      console.error('Reset password error:', err);
      setError(mapFirebaseError(err));
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Send email verification to current user
   */
  const sendVerificationEmail = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No user logged in');
      }
      
      await sendEmailVerification(currentUser);
      return true;
    } catch (err) {
      console.error('Send verification email error:', err);
      setError(mapFirebaseError(err));
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Verify email with action code
   */
  const verifyEmail = useCallback(async (actionCode: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      // Apply the email verification code
      await applyActionCode(auth, actionCode);
      
      // If user is logged in, refresh the user
      if (auth.currentUser) {
        const userProfile = await formatUserProfile(auth.currentUser);
        setUser(userProfile);
      }
      
      return true;
    } catch (err) {
      console.error('Verify email error:', err);
      setError(mapFirebaseError(err));
      return false;
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
    resetPassword,
    sendVerificationEmail,
    verifyEmail,
    setError
  }), [
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
    verifyEmail
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}