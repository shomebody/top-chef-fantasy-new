import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  // Log context for debugging
  console.log('useAuth - context:', context);
  
  // Ensure required fields are always defined, React 19-friendly
  const safeContext = {
    isAuthenticated: context.isAuthenticated ?? false, // Default to false if undefined
    loading: context.loading ?? true, // Default to true if undefined
    ...context, // Spread rest of context (e.g., user, setUser)
  };
  
  return safeContext;
};