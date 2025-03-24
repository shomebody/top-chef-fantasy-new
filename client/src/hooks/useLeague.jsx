import { useContext } from 'react';
import { LeagueContext } from '../context/LeagueContext.jsx';

export const useLeague = () => {
  const context = useContext(LeagueContext);
  
  if (!context) {
    throw new Error('useLeague must be used within a LeagueProvider');
  }
  
  return context;
};

