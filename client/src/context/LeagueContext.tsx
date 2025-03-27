// client/src/context/LeagueContext.tsx
import { createContext, useState, type ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { League, UseLeagueReturn } from '../types/league';

export const LeagueContext = createContext<UseLeagueReturn>({
  leagues: [],
  currentLeague: null,
  chefs: [],
  leaderboard: [],
  challenges: [],
  loading: false,
  error: null,
  fetchUserLeagues: async () => {},
  fetchLeagueDetails: async () => {},
  createLeague: async () => ({ _id: '', name: '', creator: '', season: 0, maxMembers: 0, maxRosterSize: 0, status: 'draft', inviteCode: '', scoringSettings: { quickfireWin: 0, challengeWin: 0, topThree: 0, bottomThree: 0, elimination: 0, finalWinner: 0 }, currentWeek: 0, members: [] }),
  joinLeagueWithCode: async () => ({ _id: '', name: '', creator: '', season: 0, maxMembers: 0, maxRosterSize: 0, status: 'draft', inviteCode: '', scoringSettings: { quickfireWin: 0, challengeWin: 0, topThree: 0, bottomThree: 0, elimination: 0, finalWinner: 0 }, currentWeek: 0, members: [] }),
  switchLeague: () => {},
  updateLeague: async () => ({ _id: '', name: '', creator: '', season: 0, maxMembers: 0, maxRosterSize: 0, status: 'draft', inviteCode: '', scoringSettings: { quickfireWin: 0, challengeWin: 0, topThree: 0, bottomThree: 0, elimination: 0, finalWinner: 0 }, currentWeek: 0, members: [] }),
  draftChef: async () => ({ _id: '', name: '', creator: '', season: 0, maxMembers: 0, maxRosterSize: 0, status: 'draft', inviteCode: '', scoringSettings: { quickfireWin: 0, challengeWin: 0, topThree: 0, bottomThree: 0, elimination: 0, finalWinner: 0 }, currentWeek: 0, members: [] }),
  fetchChallenges: async () => [],
});

interface LeagueProviderProps {
  children: ReactNode;
}

export function LeagueProvider({ children }: LeagueProviderProps) {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [currentLeague, setCurrentLeague] = useState<League | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();

  const fetchUserLeagues = async () => {
    if (!isAuthenticated || !user) return;
    setLoading(true);
    // Mock data
    const mockLeagues: League[] = [
      { _id: '1', name: 'Mock League', season: 1, status: 'draft', currentWeek: 1, maxMembers: 10, maxRosterSize: 5, members: [{ user: { _id: user._id, name: user.name || 'User' }, role: 'owner', score: 0 }] }
    ];
    setLeagues(mockLeagues);
    setCurrentLeague(mockLeagues[0]);
    setLoading(false);
  };

  const fetchLeagueDetails = async (leagueId: string) => {
    setLoading(true);
    const league = leagues.find(l => l._id === leagueId) || null;
    setCurrentLeague(league);
    setLoading(false);
  };

  const createLeague = async (leagueData: Partial<League>) => {
    setLoading(true);
    const newLeague: League = {
      _id: Date.now().toString(),
      name: leagueData.name || 'New League',
      season: 1,
      status: 'draft',
      currentWeek: 1,
      maxMembers: 10,
      maxRosterSize: 5,
      members: user ? [{ user: { _id: user._id, name: user.name || 'User' }, role: 'owner', score: 0 }] : []
    };
    setLeagues(prev => [...prev, newLeague]);
    setCurrentLeague(newLeague);
    setLoading(false);
    return newLeague;
  };

  const joinLeagueWithCode = async (inviteCode: string) => {
    setLoading(true);
    const newLeague: League = {
      _id: Date.now().toString(),
      name: `League ${inviteCode}`,
      season: 1,
      status: 'draft',
      currentWeek: 1,
      maxMembers: 10,
      maxRosterSize: 5,
      members: user ? [{ user: { _id: user._id, name: user.name || 'User' }, role: 'member', score: 0 }] : []
    };
    setLeagues(prev => [...prev, newLeague]);
    setCurrentLeague(newLeague);
    setLoading(false);
    return newLeague;
  };

  const value: UseLeagueReturn = {
    leagues,
    currentLeague,
    chefs: [],
    leaderboard: [],
    challenges: [],
    loading,
    error,
    fetchUserLeagues,
    fetchLeagueDetails,
    createLeague,
    joinLeagueWithCode,
    switchLeague: (leagueId: string) => setCurrentLeague(leagues.find(l => l._id === leagueId) || null),
    updateLeague: async () => ({ _id: '', name: '', creator: '', season: 0, maxMembers: 0, maxRosterSize: 0, status: 'draft', inviteCode: '', scoringSettings: { quickfireWin: 0, challengeWin: 0, topThree: 0, bottomThree: 0, elimination: 0, finalWinner: 0 }, currentWeek: 0, members: [] }),
    draftChef: async () => ({ _id: '', name: '', creator: '', season: 0, maxMembers: 0, maxRosterSize: 0, status: 'draft', inviteCode: '', scoringSettings: { quickfireWin: 0, challengeWin: 0, topThree: 0, bottomThree: 0, elimination: 0, finalWinner: 0 }, currentWeek: 0, members: [] }),
    fetchChallenges: async () => []
  };

  return <LeagueContext.Provider value={value}>{children}</LeagueContext.Provider>;
}