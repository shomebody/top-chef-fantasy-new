// client/src/types/league.d.ts

export interface League {
  _id: string;
  name: string;
  season: number;
  status: string;
  currentWeek: number;
  maxMembers: number;
  maxRosterSize: number;
  members: any[];
}

export interface LeaderboardEntry {
  user: {
    _id: string;
    name: string;
  };
  score: number;
  rosterCount: number;
}

export interface UseLeagueReturn {
  leagues: League[];
  currentLeague: League | null;
  leaderboard: LeaderboardEntry[];
  loading: boolean;
  error: string | null;
  fetchUserLeagues: () => Promise<any>;
  fetchLeagueDetails: (leagueId: string) => Promise<any>;
  createLeague: (leagueData: any) => Promise<any>;
  joinLeagueWithCode: (inviteCode: string) => Promise<any>;
  switchLeague: (leagueId: string) => void;
  updateLeague: (leagueId: string, updateData: any) => Promise<any>;
}
