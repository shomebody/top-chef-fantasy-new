// client/src/context/LeagueContext.tsx
import { createContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  updateDoc, 
  addDoc, 
  arrayUnion, 
  serverTimestamp, 
  Timestamp, 
  type DocumentData,
  type QueryDocumentSnapshot
} from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { db } from '../config/firebase';
import api from '../services/api';

export interface ChefData {
  _id: string;
  name: string;
  bio: string;
  hometown: string;
  specialty: string;
  image: string;
  status: 'active' | 'eliminated' | 'winner';
  eliminationWeek: number | null;
  stats: {
    wins: number;
    eliminations: number;
    quickfireWins: number;
    challengeWins: number;
    totalPoints: number;
  };
  weeklyPerformance: Array<{
    week: number;
    points: number;
    rank: number;
    highlights: string;
  }>;
}

export interface LeagueMember {
  user: {
    _id: string;
    name: string;
    email?: string;
    avatar?: string;
  };
  role: 'owner' | 'admin' | 'member';
  score: number;
  roster?: Array<{
    chef: string | ChefData;
    drafted: string | Date;
    active: boolean;
  }>;
  joinedAt?: string | Date;
}

export interface League {
  _id: string;
  name: string;
  creator: string;
  season: number;
  maxMembers: number;
  maxRosterSize: number;
  status: 'draft' | 'active' | 'completed';
  inviteCode: string;
  scoringSettings: {
    quickfireWin: number;
    challengeWin: number;
    topThree: number;
    bottomThree: number;
    elimination: number;
    finalWinner: number;
  };
  currentWeek: number;
  members: LeagueMember[];
  draftOrder?: Array<{
    user: string;
    position: number;
  }>;
  createdAt?: string | Date;
}

export interface LeaderboardEntry {
  user: {
    _id: string;
    name: string;
    email?: string;
    avatar?: string;
  };
  score: number;
  rosterCount: number;
}

export interface Challenge {
  _id: string;
  season: number;
  week: number;
  title: string;
  description: string;
  location: string;
  isQuickfire: boolean;
  guest: string;
  winner: string | ChefData | null;
  topChefs: string[] | ChefData[];
  bottomChefs: string[] | ChefData[];
  eliminatedChef: string | ChefData | null;
  airDate: string | Date;
  status: 'upcoming' | 'completed';
}

export interface UseLeagueReturn {
  leagues: League[];
  currentLeague: League | null;
  chefs: ChefData[];
  leaderboard: LeaderboardEntry[];
  challenges: Challenge[];
  loading: boolean;
  error: string | null;
  fetchUserLeagues: () => Promise<void>;
  fetchLeagueDetails: (leagueId: string) => Promise<void>;
  createLeague: (leagueData: Partial<League>) => Promise<League>;
  joinLeagueWithCode: (inviteCode: string) => Promise<League>;
  switchLeague: (leagueId: string) => void;
  updateLeague: (leagueId: string, updateData: Partial<League>) => Promise<League>;
  draftChef: (leagueId: string, chefId: string) => Promise<League>;
  fetchChallenges: (season: number) => Promise<Challenge[]>;
}

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
  createLeague: async () => ({ 
    _id: '', name: '', creator: '', season: 0, maxMembers: 0, maxRosterSize: 0,
    status: 'draft', inviteCode: '', scoringSettings: { 
      quickfireWin: 0, challengeWin: 0, topThree: 0, bottomThree: 0, elimination: 0, finalWinner: 0 
    }, currentWeek: 0, members: [] 
  }),
  joinLeagueWithCode: async () => ({ 
    _id: '', name: '', creator: '', season: 0, maxMembers: 0, maxRosterSize: 0,
    status: 'draft', inviteCode: '', scoringSettings: { 
      quickfireWin: 0, challengeWin: 0, topThree: 0, bottomThree: 0, elimination: 0, finalWinner: 0 
    }, currentWeek: 0, members: [] 
  }),
  switchLeague: () => {},
  updateLeague: async () => ({ 
    _id: '', name: '', creator: '', season: 0, maxMembers: 0, maxRosterSize: 0,
    status: 'draft', inviteCode: '', scoringSettings: { 
      quickfireWin: 0, challengeWin: 0, topThree: 0, bottomThree: 0, elimination: 0, finalWinner: 0 
    }, currentWeek: 0, members: [] 
  }),
  draftChef: async () => ({ 
    _id: '', name: '', creator: '', season: 0, maxMembers: 0, maxRosterSize: 0,
    status: 'draft', inviteCode: '', scoringSettings: { 
      quickfireWin: 0, challengeWin: 0, topThree: 0, bottomThree: 0, elimination: 0, finalWinner: 0 
    }, currentWeek: 0, members: [] 
  }),
  fetchChallenges: async () => ([])
});

interface LeagueProviderProps {
  children: ReactNode;
}

export function LeagueProvider({ children }: LeagueProviderProps) {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [currentLeague, setCurrentLeague] = useState<League | null>(null);
  const [chefs, setChefs] = useState<ChefData[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { user, isAuthenticated } = useAuth();

  console.log('LeagueProvider initialized, user:', user?._id || 'none');

  const convertLeagueData = (doc: QueryDocumentSnapshot<DocumentData>): League => {
    const data = doc.data();
    console.log('Converting league data for doc:', doc.id);
    return {
      _id: doc.id,
      name: data.name || '',
      creator: data.creator || '',
      season: data.season || 0,
      maxMembers: data.maxMembers || 10,
      maxRosterSize: data.maxRosterSize || 5,
      status: (data.status as 'draft' | 'active' | 'completed') || 'draft',
      inviteCode: data.inviteCode || '',
      scoringSettings: data.scoringSettings || {
        quickfireWin: 10,
        challengeWin: 20,
        topThree: 5,
        bottomThree: -5,
        elimination: -15,
        finalWinner: 50
      },
      currentWeek: data.currentWeek || 1,
      members: data.members || [],
      draftOrder: data.draftOrder || [],
      createdAt: data.createdAt?.toDate() || new Date()
    };
  };

  useEffect(() => {
    if (!isAuthenticated || !user?._id) {
      console.log('No authenticated user, resetting leagues');
      setLeagues([]);
      setCurrentLeague(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    console.log('Setting up leagues listener for user:', user._id);

    const leaguesQuery = query(
      collection(db, 'leagues'),
      where(`members.${user._id}`, '!=', null)
    );

    const unsubscribe = onSnapshot(
      leaguesQuery,
      (snapshot) => {
        console.log('onSnapshot triggered for leagues');
        const leagueData: League[] = [];
        snapshot.forEach((doc) => {
          try {
            leagueData.push(convertLeagueData(doc));
          } catch (err) {
            console.error('Error converting league doc:', doc.id, err);
          }
        });

        console.log(`Loaded ${leagueData.length} leagues for user:`, user._id);
        setLeagues(leagueData);
        
        if (leagueData.length > 0 && !currentLeague) {
          setCurrentLeague(leagueData[0]);
        }
        setLoading(false);
      },
      (err) => {
        console.error('onSnapshot error:', err.message || err);
        setError('Failed to load your leagues: ' + (err.message || 'Unknown error'));
        setLoading(false);
      }
    );

    return () => {
      console.log('Cleaning up leagues listener');
      unsubscribe();
    };
  }, [isAuthenticated, user?._id, currentLeague]);

  const fetchUserLeagues = useCallback(async (): Promise<void> => {
    if (!isAuthenticated || !user?._id) {
      console.log('No authenticated user for fetchUserLeagues');
      setLeagues([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('Fetching leagues for user:', user._id);

      const leaguesQuery = query(
        collection(db, 'leagues'),
        where(`members.${user._id}`, '!=', null)
      );

      const querySnapshot = await getDocs(leaguesQuery);
      const leagueData: League[] = [];
      querySnapshot.forEach((doc) => {
        leagueData.push(convertLeagueData(doc));
      });

      console.log(`Found ${leagueData.length} leagues for user:`, user._id);
      setLeagues(leagueData);
      if (leagueData.length > 0 && !currentLeague) {
        setCurrentLeague(leagueData[0]);
      }
    } catch (err) {
      console.error('Error fetching leagues via Firestore:', err);
      try {
        console.log('Falling back to API for leagues');
        const response = await api.get('/leagues');
        console.log('API returned leagues:', response.data?.length || 0);
        setLeagues(response.data || []);
        if (response.data?.length > 0 && !currentLeague) {
          setCurrentLeague(response.data[0]);
        }
      } catch (apiErr) {
        console.error('API fallback failed:', apiErr);
        setError('Failed to load your leagues');
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?._id, currentLeague]);

  const fetchLeagueDetails = useCallback(async (leagueId: string): Promise<void> => {
    if (!leagueId) {
      console.log('No leagueId provided for fetchLeagueDetails');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('Fetching details for league:', leagueId);

      const leagueDoc = await getDoc(doc(db, 'leagues', leagueId));
      if (!leagueDoc.exists()) {
        console.log('League not found in Firestore:', leagueId);
        throw new Error('League not found');
      }

      const leagueData = convertLeagueData(leagueDoc as QueryDocumentSnapshot<DocumentData>);
      setCurrentLeague(leagueData);
      console.log('League details loaded:', leagueData.name);

      const chefsQuery = query(collection(db, 'chefs'), orderBy('stats.totalPoints', 'desc'));
      const chefsSnapshot = await getDocs(chefsQuery);
      const chefsData: ChefData[] = [];
      
      chefsSnapshot.forEach((doc) => {
        const data = doc.data();
        chefsData.push({
          _id: doc.id,
          name: data.name || '',
          bio: data.bio || '',
          hometown: data.hometown || '',
          specialty: data.specialty || '',
          image: data.image || '',
          status: (data.status as 'active' | 'eliminated' | 'winner') || 'active',
          eliminationWeek: data.eliminationWeek || null,
          stats: data.stats || {
            wins: 0,
            eliminations: 0,
            quickfireWins: 0,
            challengeWins: 0,
            totalPoints: 0
          },
          weeklyPerformance: data.weeklyPerformance || []
        });
      });
      
      setChefs(chefsData);
      console.log(`Loaded ${chefsData.length} chefs`);

      const leaderboardData: LeaderboardEntry[] = [];
      for (const member of leagueData.members) {
        leaderboardData.push({
          user: {
            _id: typeof member.user === 'string' ? member.user : member.user._id,
            name: typeof member.user === 'string' ? 'Unknown' : member.user.name,
            email: typeof member.user === 'string' ? '' : member.user.email,
            avatar: typeof member.user === 'string' ? '' : member.user.avatar
          },
          score: member.score || 0,
          rosterCount: (member.roster?.length || 0)
        });
      }
      
      leaderboardData.sort((a, b) => b.score - a.score);
      setLeaderboard(leaderboardData);
      console.log(`Leaderboard created with ${leaderboardData.length} entries`);

      const challengesQuery = query(
        collection(db, 'challenges'),
        where('season', '==', leagueData.season),
        orderBy('week', 'asc')
      );
      
      const challengesSnapshot = await getDocs(challengesQuery);
      const challengesData: Challenge[] = [];
      
      challengesSnapshot.forEach((doc) => {
        const data = doc.data();
        challengesData.push({
          _id: doc.id,
          season: data.season || 0,
          week: data.week || 0,
          title: data.title || '',
          description: data.description || '',
          location: data.location || '',
          isQuickfire: data.isQuickfire || false,
          guest: data.guest || '',
          winner: data.winner || null,
          topChefs: data.topChefs || [],
          bottomChefs: data.bottomChefs || [],
          eliminatedChef: data.eliminatedChef || null,
          airDate: data.airDate instanceof Timestamp ? data.airDate.toDate() : new Date(),
          status: (data.status as 'upcoming' | 'completed') || 'upcoming'
        });
      });
      
      setChallenges(challengesData);
      console.log(`Loaded ${challengesData.length} challenges for season ${leagueData.season}`);
    } catch (err) {
      console.error('Error in fetchLeagueDetails:', (err as Error).message || err);
      try {
        console.log('Falling back to API for league details');
        const leagueResponse = await api.get(`/leagues/${leagueId}`);
        setCurrentLeague(leagueResponse.data);
        
        const chefsResponse = await api.get('/chefs');
        setChefs(chefsResponse.data || []);
        
        const leaderboardResponse = await api.get(`/leagues/${leagueId}/leaderboard`);
        setLeaderboard(leaderboardResponse.data || []);
        
        const challengesResponse = await api.get('/challenges', {
          params: { season: leagueResponse.data.season }
        });
        setChallenges(challengesResponse.data || []);
      } catch (apiErr) {
        console.error('API fallback failed:', apiErr);
        setError('Failed to load league details: ' + (err as Error).message || 'Unknown error');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const createLeague = useCallback(async (leagueData: Partial<League>): Promise<League> => {
    // ... (unchanged, but add console logs if needed)
    if (!isAuthenticated || !user?._id) {
      throw new Error('You must be logged in to create a league');
    }
    try {
      setLoading(true);
      setError(null);
      console.log('Creating new league:', leagueData.name);
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const newLeague = {
        name: leagueData.name || 'New League',
        creator: user._id,
        season: leagueData.season || 20,
        maxMembers: leagueData.maxMembers || 10,
        maxRosterSize: leagueData.maxRosterSize || 5,
        inviteCode,
        scoringSettings: leagueData.scoringSettings || {
          quickfireWin: 10,
          challengeWin: 20,
          topThree: 5,
          bottomThree: -5,
          elimination: -15,
          finalWinner: 50
        },
        status: 'draft' as const,
        currentWeek: 1,
        members: [{
          user: {
            _id: user._id,
            name: user.name || 'Unknown',
            email: user.email || '',
            avatar: user.avatar || ''
          },
          role: 'owner' as const,
          score: 0,
          roster: [],
          joinedAt: new Date().toISOString()
        }],
        createdAt: new Date().toISOString()
      };
      const leagueRef = await addDoc(collection(db, 'leagues'), {
        ...newLeague,
        createdAt: serverTimestamp()
      });
      const leagueDoc = await getDoc(leagueRef);
      if (!leagueDoc.exists()) {
        throw new Error('Failed to retrieve created league');
      }
      const league: League = {
        _id: leagueDoc.id,
        ...newLeague,
        createdAt: leagueDoc.data().createdAt?.toDate() || new Date()
      };
      setLeagues(prevLeagues => [...prevLeagues, league]);
      setCurrentLeague(league);
      console.log('League created successfully:', league.name);
      return league;
    } catch (err) {
      console.error('Error creating league:', (err as Error).message || err);
      setError('Failed to create league');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const joinLeagueWithCode = useCallback(async (inviteCode: string): Promise<League> => {
    // ... (unchanged, but add console logs if needed)
    if (!isAuthenticated || !user?._id) {
      throw new Error('You must be logged in to join a league');
    }
    try {
      setLoading(true);
      setError(null);
      console.log('Joining league with code:', inviteCode);
      const leaguesQuery = query(
        collection(db, 'leagues'),
        where('inviteCode', '==', inviteCode)
      );
      const querySnapshot = await getDocs(leaguesQuery);
      if (querySnapshot.empty) {
        throw new Error('League not found with that invite code');
      }
      const leagueDoc = querySnapshot.docs[0];
      const leagueData = leagueDoc.data();
      if (leagueData.members.some((m: any) => 
        (typeof m.user === 'string' && m.user === user._id) || 
        (typeof m.user === 'object' && m.user._id === user._id)
      )) {
        throw new Error('You are already a member of this league');
      }
      if (leagueData.members.length >= leagueData.maxMembers) {
        throw new Error('This league is full');
      }
      const newMember = {
        user: {
          _id: user._id,
          name: user.name || 'Unknown',
          email: user.email || '',
          avatar: user.avatar || ''
        },
        role: 'member' as const,
        score: 0,
        roster: [],
        joinedAt: new Date().toISOString()
      };
      await updateDoc(doc(db, 'leagues', leagueDoc.id), {
        members: arrayUnion(newMember)
      });
      const updatedLeagueDoc = await getDoc(doc(db, 'leagues', leagueDoc.id));
      if (!updatedLeagueDoc.exists()) {
        throw new Error('Failed to retrieve updated league');
      }
      const league = convertLeagueData(updatedLeagueDoc as QueryDocumentSnapshot<DocumentData>);
      setLeagues(prevLeagues => [...prevLeagues, league]);
      setCurrentLeague(league);
      console.log('Successfully joined league:', league.name);
      return league;
    } catch (err) {
      console.error('Error joining league:', (err as Error).message || err);
      setError(err instanceof Error ? err.message : 'Failed to join league');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const switchLeague = useCallback((leagueId: string) => {
    const league = leagues.find(l => l._id === leagueId);
    if (league) {
      console.log('Switching to league:', league.name);
      setCurrentLeague(league);
      fetchLeagueDetails(leagueId).catch(err => {
        console.error('Error switching league:', err.message || err);
      });
    } else {
      console.warn('League not found in user leagues:', leagueId);
    }
  }, [leagues, fetchLeagueDetails]);

  const updateLeague = useCallback(async (leagueId: string, updateData: Partial<League>): Promise<League> => {
    // ... (unchanged, but add console logs if needed)
    if (!isAuthenticated || !user?._id) {
      throw new Error('You must be logged in to update a league');
    }
    try {
      setLoading(true);
      setError(null);
      console.log('Updating league:', leagueId, updateData);
      const leagueRef = doc(db, 'leagues', leagueId);
      const leagueDoc = await getDoc(leagueRef);
      if (!leagueDoc.exists()) {
        throw new Error('League not found');
      }
      const leagueData = leagueDoc.data();
      const userMember = leagueData.members.find((m: any) => 
        (typeof m.user === 'string' && m.user === user._id) || 
        (typeof m.user === 'object' && m.user._id === user._id)
      );
      if (!userMember || (userMember.role !== 'owner' && userMember.role !== 'admin')) {
        throw new Error('You do not have permission to update this league');
      }
      const updates: Record<string, any> = {};
      if (updateData.name) updates.name = updateData.name;
      if (updateData.maxMembers) updates.maxMembers = updateData.maxMembers;
      if (updateData.maxRosterSize) updates.maxRosterSize = updateData.maxRosterSize;
      if (updateData.scoringSettings) updates.scoringSettings = updateData.scoringSettings;
      if (updateData.status) updates.status = updateData.status;
      if (updateData.currentWeek !== undefined) updates.currentWeek = updateData.currentWeek;
      await updateDoc(leagueRef, updates);
      const updatedLeagueDoc = await getDoc(leagueRef);
      if (!updatedLeagueDoc.exists()) {
        throw new Error('Failed to retrieve updated league');
      }
      const league = convertLeagueData(updatedLeagueDoc as QueryDocumentSnapshot<DocumentData>);
      setLeagues(prevLeagues => 
        prevLeagues.map(l => l._id === leagueId ? league : l)
      );
      if (currentLeague?._id === leagueId) {
        setCurrentLeague(league);
      }
      console.log('League successfully updated:', league.name);
      return league;
    } catch (err) {
      console.error('Error updating league:', (err as Error).message || err);
      setError('Failed to update league');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, currentLeague]);

  const draftChef = useCallback(async (leagueId: string, chefId: string): Promise<League> => {
    // ... (unchanged, but add console logs if needed)
    if (!isAuthenticated || !user?._id) {
      throw new Error('You must be logged in to draft a chef');
    }
    try {
      setLoading(true);
      setError(null);
      console.log('Drafting chef:', chefId, 'for league:', leagueId);
      const leagueRef = doc(db, 'leagues', leagueId);
      const leagueDoc = await getDoc(leagueRef);
      if (!leagueDoc.exists()) {
        throw new Error('League not found');
      }
      const leagueData = leagueDoc.data();
      if (leagueData.status !== 'draft') {
        throw new Error('League is not in draft mode');
      }
      const memberIndex = leagueData.members.findIndex((m: any) => 
        (typeof m.user === 'string' && m.user === user._id) || 
        (typeof m.user === 'object' && m.user._id === user._id)
      );
      if (memberIndex === -1) {
        throw new Error('You are not a member of this league');
      }
      const member = leagueData.members[memberIndex];
      if (member.roster && member.roster.length >= leagueData.maxRosterSize) {
        throw new Error('Your roster is full');
      }
      const isChefDrafted = leagueData.members.some((m: any) => 
        m.roster && m.roster.some((r: any) => 
          (typeof r.chef === 'string' && r.chef === chefId) || 
          (typeof r.chef === 'object' && r.chef._id === chefId)
        )
      );
      if (isChefDrafted) {
        throw new Error('This chef has already been drafted');
      }
      const newRoster = [...(member.roster || []), {
        chef: chefId,
        drafted: new Date().toISOString(),
        active: true
      }];
      const updatedMembers = [...leagueData.members];
      updatedMembers[memberIndex] = {
        ...member,
        roster: newRoster
      };
      await updateDoc(leagueRef, {
        members: updatedMembers
      });
      const updatedLeagueDoc = await getDoc(leagueRef);
      if (!updatedLeagueDoc.exists()) {
        throw new Error('Failed to retrieve updated league');
      }
      const league = convertLeagueData(updatedLeagueDoc as QueryDocumentSnapshot<DocumentData>);
      setLeagues(prevLeagues => 
        prevLeagues.map(l => l._id === leagueId ? league : l)
      );
      if (currentLeague?._id === leagueId) {
        setCurrentLeague(league);
      }
      console.log('Chef successfully drafted');
      return league;
    } catch (err) {
      console.error('Error drafting chef:', (err as Error).message || err);
      setError(err instanceof Error ? err.message : 'Failed to draft chef');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, currentLeague]);

  const fetchChallenges = useCallback(async (season: number): Promise<Challenge[]> => {
    // ... (unchanged, but add console logs if needed)
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching challenges for season:', season);
      const challengesQuery = query(
        collection(db, 'challenges'),
        where('season', '==', season),
        orderBy('week', 'asc')
      );
      const challengesSnapshot = await getDocs(challengesQuery);
      const challengesData: Challenge[] = [];
      challengesSnapshot.forEach((doc) => {
        const data = doc.data();
        challengesData.push({
          _id: doc.id,
          season: data.season || 0,
          week: data.week || 0,
          title: data.title || '',
          description: data.description || '',
          location: data.location || '',
          isQuickfire: data.isQuickfire || false,
          guest: data.guest || '',
          winner: data.winner || null,
          topChefs: data.topChefs || [],
          bottomChefs: data.bottomChefs || [],
          eliminatedChef: data.eliminatedChef || null,
          airDate: data.airDate instanceof Timestamp ? data.airDate.toDate() : new Date(),
          status: (data.status as 'upcoming' | 'completed') || 'upcoming'
        });
      });
      console.log(`Loaded ${challengesData.length} challenges`);
      setChallenges(challengesData);
      return challengesData;
    } catch (err) {
      console.error('Error fetching challenges via Firestore:', err);
      try {
        console.log('Falling back to API for challenges');
        const response = await api.get('/challenges', { params: { season } });
        const challengesData = response.data || [];
        console.log(`Loaded ${challengesData.length} challenges via API`);
        setChallenges(challengesData);
        return challengesData;
      } catch (apiErr) {
        console.error('API fallback failed:', apiErr);
        setError('Failed to load challenges');
        throw apiErr;
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const contextValue = useMemo(() => ({
    leagues,
    currentLeague,
    chefs,
    leaderboard,
    challenges,
    loading,
    error,
    fetchUserLeagues,
    fetchLeagueDetails,
    createLeague,
    joinLeagueWithCode,
    switchLeague,
    updateLeague,
    draftChef,
    fetchChallenges
  }), [
    leagues,
    currentLeague,
    chefs,
    leaderboard,
    challenges,
    loading,
    error,
    fetchUserLeagues,
    fetchLeagueDetails,
    createLeague,
    joinLeagueWithCode,
    switchLeague,
    updateLeague,
    draftChef,
    fetchChallenges
  ]);

  return (
    <LeagueContext.Provider value={contextValue}>
      {children}
    </LeagueContext.Provider>
  );
}