import { useContext } from 'react';
import { AuthContext, AuthContextProps } from '../context/AuthContext';

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  isAdmin?: boolean;
  emailVerified?: boolean;
  avatar?: string;
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

export type { AuthContextProps };
