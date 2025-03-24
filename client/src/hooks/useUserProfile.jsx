// client/src/hooks/useUserProfile.jsx
import { useContext } from 'react';
import { UserContext } from '../context/UserContext.jsx';

export const useUserProfile = () => {
  const context = useContext(UserContext);
  
  if (!context) {
    throw new Error('useUserProfile must be used within a UserProvider');
  }
  
  return context;
};