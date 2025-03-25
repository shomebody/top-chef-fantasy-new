// client/src/hooks/useAuth.tsx
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';


/**
 * Represents the user profile with Firebase and application-specific data
 */
export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  isAdmin?: boolean;
  emailVerified?: boolean;
  avatar?: string;
}

/**
 * Authentication context interface defining all authentication-related functionality
 */
export interface AuthContextProps {
  user: UserProfile | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<UserProfile | null>;
  logout: () => Promise<void>;
  register: (userData: { name: string; email: string; password: string }) => Promise<UserProfile | null>;
  updateProfile: (userData: { name?: string; email?: string; password?: string; avatar?: string }) => Promise<UserProfile | null>;
  resetPassword?: (email: string) => Promise<boolean>;
  sendVerificationEmail?: () => Promise<boolean>;
  verifyEmail?: (actionCode: string) => Promise<boolean>;
  setError: (error: string | null) => void;
}

/**
 * Custom hook providing access to authentication context with Firebase integration
 * @returns Authentication context with safe defaults for all properties
 */
export function useAuth(): AuthContextProps {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  // Create a type-safe version of the context with defaults
  const safeContext: AuthContextProps = {
    // Core properties
    user: context.user || null,
    isAuthenticated: Boolean(context.isAuthenticated),
    loading: Boolean(context.loading),
    error: context.error || null,
    
    // Core methods
    login: context.login || (async () => null),
    logout: context.logout || (async () => {}),
    register: context.register || (async () => null),
    updateProfile: context.updateProfile || (async () => null),
    setError: context.setError || (() => {}),
    
    // Optional Firebase-specific methods
    resetPassword: context.resetPassword,
    sendVerificationEmail: context.sendVerificationEmail,
    verifyEmail: context.verifyEmail
  };
  
  return safeContext;
}