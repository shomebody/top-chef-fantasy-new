import { useContext } from 'react';
import { LeagueContext } from '../context/LeagueContext';
import type { UseLeagueReturn } from '../hooks/useLeague.d';

export const useLeague = (): UseLeagueReturn => {
  const context = useContext(LeagueContext);
  
  if (!context) {
    throw new Error('useLeague must be used within a LeagueProvider');
  }
  
  return context;
};

export type { UseLeagueReturn };