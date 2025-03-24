import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  query, 
  where,
  arrayUnion,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

// League service functions
const LeagueService = {
  // Get all leagues for current user
  getUserLeagues: async (userId) => {
    try {
      const leaguesRef = collection(db, 'leagues');
      
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
      }));
      
      return leagues;
    } catch (error) {
      console.error('Error fetching leagues:', error);
      throw error;
    }
  },
  
  // Get a single league by ID
  getLeagueById: async (id) => {
    try {
      const leagueDoc = await getDoc(doc(db, 'leagues', id));
      
      if (!leagueDoc.exists()) {
        throw new Error('League not found');
      }
      
      return {
        _id: leagueDoc.id,
        ...leagueDoc.data()
      };
    } catch (error) {
      console.error('Error fetching league:', error);
      throw error;
    }
  },
  
  // Create a new league
  createLeague: async (leagueData, userId) => {
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
      };
    } catch (error) {
      console.error('Error creating league:', error);
      throw error;
    }
  },
  
  // Join a league with invite code
  joinLeagueWithCode: async (inviteCode, userId) => {
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
      const league = leagueDoc.data();
      
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
      };
    } catch (error) {
      console.error('Error joining league:', error);
      throw error;
    }
  },
  
  // Other methods follow similar patterns
};

export default LeagueService;