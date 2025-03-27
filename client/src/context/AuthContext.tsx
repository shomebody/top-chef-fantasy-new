import { createContext, useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
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
  updateProfile: (userData: { name?: string; email?: string; password?: string; avatar?: string }) => Promise<UserProfile | null>;
  setError: (error: string | null) => void;
}

const auth = getAuth();
export const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('AuthProvider effect running');
    console.log('Firebase auth initialized:', auth);
    setLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('onAuthStateChanged fired, firebaseUser:', firebaseUser?.uid || null);
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
      console.log('Setting loading to false');
      setLoading(false);
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
  }, []);

  const formatUserProfile = async (firebaseUser: any): Promise<UserProfile> => {
    console.log('formatUserProfile started for user:', firebaseUser.uid);
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    console.log('Firestore data fetched:', userDoc.data());
    const profile: UserProfile = {
      _id: firebaseUser.uid,
      name: userDoc.data()?.name || firebaseUser.displayName || 'Unknown',
      email: firebaseUser.email || '',
      isAdmin: userDoc.data()?.isAdmin || false,
      emailVerified: firebaseUser.emailVerified || false,
      avatar: firebaseUser.photoURL || userDoc.data()?.avatar || '',
    };
    console.log('formatUserProfile completed:', profile);
    return profile;
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('Login attempt:', { email });
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      const userProfile = await formatUserProfile(firebaseUser);
      setUser(userProfile);
      setIsAuthenticated(true);
      console.log('Login successful, user:', userProfile);
      return userProfile;
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
      return null;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setIsAuthenticated(false);
      console.log('Logout successful');
    } catch (err) {
      console.error('Logout error:', err);
      setError(err instanceof Error ? err.message : 'Logout failed');
    }
  };

  const register = async (userData: { name: string; email: string; password: string }) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      const firebaseUser = userCredential.user;
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        name: userData.name,
        email: userData.email,
        isAdmin: false,
      });
      const userProfile = await formatUserProfile(firebaseUser);
      setUser(userProfile);
      setIsAuthenticated(true);
      console.log('Register successful, user:', userProfile);
      return userProfile;
    } catch (err) {
      console.error('Register error:', err);
      setError(err instanceof Error ? err.message : 'Registration failed');
      return null;
    }
  };

  const updateProfile = async (userData: { name?: string; email?: string; password?: string; avatar?: string }) => {
    console.log('Update profile not implemented');
    return null;
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, error, login, logout, register, updateProfile, setError }}>
      {children}
    </AuthContext.Provider>
  );
};