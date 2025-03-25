// client/src/context/AuthContext.tsx
import { createContext, useState, useEffect, useMemo, useCallback, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import AuthService from '../services/authService';

interface AuthContextType {
  user: {
    _id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    isAdmin?: boolean;
  } | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  register: (userData: { email: string; password: string; name: string }) => Promise<any>;
  updateProfile: (userData: { name?: string; avatar?: string }) => Promise<any>;
  setError: (error: string | null) => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,
  login: async () => null,
  logout: async () => {},
  register: async () => null,
  updateProfile: async () => null,
  setError: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthContextType['user']>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      setLoading(true);

      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

          if (userDoc.exists()) {
            setUser({
              _id: firebaseUser.uid,
              ...userDoc.data(),
              emailVerified: firebaseUser.emailVerified,
            } as AuthContextType['user']);
            setIsAuthenticated(true);
          } else {
            console.warn('User document not found in Firestore');
            setUser({
              _id: firebaseUser.uid,
              name: firebaseUser.displayName || '',
              email: firebaseUser.email || '',
              emailVerified: firebaseUser.emailVerified,
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

  const login = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const user = await AuthService.login(email, password);
      return user;
    } catch (error: unknown) {
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
    } catch (error: unknown) {
      console.error('Logout error:', error);
      setError(mapAuthErrorToMessage(error));
    }
  }, []);

  const register = useCallback(async (userData: { email: string; password: string; name: string }) => {
    try {
      setLoading(true);
      setError(null);

      const user = await AuthService.register(userData);
      return user;
    } catch (error: unknown) {
      console.error('Registration error:', error);
      setError(mapAuthErrorToMessage(error));
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (userData: { name?: string; avatar?: string }) => {
    try {
      setLoading(true);
      setError(null);

      const updatedUser = await AuthService.updateProfile(userData);

      setUser((prev) => ({
        ...prev!,
        ...updatedUser,
      }));

      return updatedUser;
    } catch (error: unknown) {
      console.error('Update profile error:', error);
      setError(mapAuthErrorToMessage(error));
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const mapAuthErrorToMessage = (error: unknown): string => {
    const errorCode = (error as any).code;
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
        return (error as any).message || 'Authentication failed';
    }
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      loading,
      error,
      login,
      logout,
      register,
      updateProfile,
      setError,
    }),
    [user, isAuthenticated, loading, error, login, logout, register, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}