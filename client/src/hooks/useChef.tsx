// client/src/hooks/useChef.jsx
import { useContext } from 'react';
import { ChefContext } from '../context/ChefContext.js';

export const useChef = () => {
  const context = useContext(ChefContext);
  
  if (!context) {
    throw new Error('useChef must be used within a ChefProvider');
  }
  
  return context;
};