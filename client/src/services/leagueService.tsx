import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import { db } from '../config/firebase';

interface League {
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
  members: Record<string, {
    role: 'owner' | 'admin' | 'member';
    score: number;
    joinedAt: any;
  }>;
  createdAt: any;
}

interface CreateLeagueData {
  name: string;
  season: number;
  maxMembers?: number;
  maxRosterSize?: number;
  scoringSettings?: {
    quickfireWin: number;
    challengeWin: number;
    topThree: number;
    bottomThree: number;
    elimination: number;
    finalWinner: number;
  };
}

// League service functions
const LeagueService = {
  // Get all leagues for current user
  getUserLeagues: async (userId: string): Promise<League[]> => {
    try {
      // Query leagues where the user is a member
      const leaguesQuery = query(
        collection(db, 'leagues'),
        where(`members.${userId}`, '!=', null)
      );
      
      const leaguesSnapshot = await getDocs(leaguesQuery);
      
      // Map to array with IDs
      const leagues = leaguesSnapshot.docs.map(doc => ({
        _id: doc.id,
        ...doc.data()
      })) as League[];
      
      return leagues;
    } catch (error) {
      console.error('Error fetching leagues:', error);
      throw error;
    }
  },
  
  // Get a single league by ID
  getLeagueById: async (id: string): Promise<League> => {
    try {
      const leagueDoc = await getDoc(doc(db, 'leagues', id));
      
      if (!leagueDoc.exists()) {
        throw new Error('League not found');
      }
      
      return {
        _id: leagueDoc.id,
        ...leagueDoc.data()
      } as League;
    } catch (error) {
      console.error('Error fetching league:', error);
      throw error;
    }
  },
  
  // Create a new league
  createLeague: async (leagueData: CreateLeagueData, userId: string): Promise<League> => {
    try {
      // Generate invite code
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Create initial league object
      const newLeague = {
        name: leagueData.name,
        creator: userId,
        season: leagueData.season,
        maxMembers: leagueData.maxMembers || 10,
        maxRosterSize: leagueData.maxRosterSize || 5,
        status: 'draft',
        inviteCode,
        scoringSettings: leagueData.scoringSettings || {
          quickfireWin: 10,
          challengeWin: 20,
          topThree: 5,
          bottomThree: -5,
          elimination: -15,
          finalWinner: 50
        },
        currentWeek: 1,
        members: {
          [userId]: {
            role: 'owner',
            score: 0,
            joinedAt: serverTimestamp()
          }
        },
        createdAt: serverTimestamp()
      };
      
      // Add to Firestore
      const docRef = await addDoc(collection(db, 'leagues'), newLeague);
      
      // Get the new document
      const newLeagueDoc = await getDoc(docRef);
      
      // Update user document to include the league
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        leagues: arrayUnion(docRef.id)
      });
      
      return {
        _id: newLeagueDoc.id,
        ...newLeagueDoc.data()
      } as League;
    } catch (error) {
      console.error('Error creating league:', error);
      throw error;
    }
  },
  
  // Join a league with invite code
  joinLeagueWithCode: async (inviteCode: string, userId: string): Promise<League> => {
    try {
      // Find league with invite code
      const leaguesQuery = query(
        collection(db, 'leagues'),
        where('inviteCode', '==', inviteCode)
      );
      
      const leaguesSnapshot = await getDocs(leaguesQuery);
      
      if (leaguesSnapshot.empty) {
        throw new Error('League not found with that invite code');
      }
      
      const leagueDoc = leaguesSnapshot.docs[0];
      const league = leagueDoc.data() as League & { members: Record<string, any> };
      
      // Check if league is full
      const memberCount = Object.keys(league.members || {}).length;
      if (memberCount >= league.maxMembers) {
        throw new Error('League is full');
      }
      
      // Check if user is already a member
      if (league.members && league.members[userId]) {
        throw new Error('You are already a member of this league');
      }
      
      // Add user to league members
      const leagueRef = doc(db, 'leagues', leagueDoc.id);
      await updateDoc(leagueRef, {
        [`members.${userId}`]: {
          role: 'member',
          score: 0,
          joinedAt: serverTimestamp()
        }
      });
      
      // Update user document to include the league
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        leagues: arrayUnion(leagueDoc.id)
      });
      
      // Get updated league
      const updatedLeagueDoc = await getDoc(leagueRef);
      
      return {
        _id: updatedLeagueDoc.id,
        ...updatedLeagueDoc.data()
      } as League;
    } catch (error) {
      console.error('Error joining league:', error);
      throw error;
    }
  },
  
  // Other methods follow similar patterns
};

export default LeagueService;