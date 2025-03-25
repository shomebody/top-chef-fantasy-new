import { useContext } from 'react';
import { LeagueContext, UseLeagueReturn } from '../context/LeagueContext';

export const useLeague = (): UseLeagueReturn => {
  const context = useContext(LeagueContext);
  
  if (!context) {
    throw new Error('useLeague must be used within a LeagueProvider');
  }
  
  return context;
};