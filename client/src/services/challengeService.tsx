import { collection, doc, getDoc, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import api from './api.js';

interface ChefData {
  _id: string;
  name: string;
  image?: string;
}

interface Challenge {
  _id: string;
  season: number;
  week: number;
  title: string;
  description: string;
  location: string;
  isQuickfire: boolean;
  guest: string;
  winner: string | ChefData | null;
  topChefs: Array<string | ChefData>;
  bottomChefs: Array<string | ChefData>;
  eliminatedChef: string | ChefData | null;
  airDate: Date | string;
  status: 'upcoming' | 'completed';
}

const ChallengeService = {
  // Get all challenges - Firestore implementation
  getAllChallenges: async (season?: number | string): Promise<Challenge[]> => {
    try {
      let challengesQuery;
      
      if (season) {
        challengesQuery = query(
          collection(db, 'challenges'),
          where('season', '==', typeof season === 'string' ? parseInt(season) : season),
          orderBy('week')
        );
      } else {
        challengesQuery = query(
          collection(db, 'challenges'),
          orderBy('season'),
          orderBy('week')
        );
      }
      
      const challengesSnapshot = await getDocs(challengesQuery);
      
      const challenges = challengesSnapshot.docs.map(doc => ({
        _id: doc.id,
        ...doc.data()
      })) as Challenge[];
      
      // For each challenge, populate chef references
      for (const challenge of challenges) {
        // Populate winner
        if (challenge.winner) {
          const winnerDoc = await getDoc(doc(db, 'chefs', challenge.winner as string));
          if (winnerDoc.exists()) {
            const winnerData = winnerDoc.data();
            challenge.winner = {
              _id: winnerDoc.id,
              name: winnerData.name,
              image: winnerData.image
            };
          }
        }
        
        // Populate topChefs
        if (challenge.topChefs && challenge.topChefs.length > 0) {
          const topChefDocs = await Promise.all(
            (challenge.topChefs as string[]).map(chefId => getDoc(doc(db, 'chefs', chefId)))
          );
          
          challenge.topChefs = topChefDocs
            .filter(doc => doc.exists())
            .map(doc => {
              const data = doc.data();
              return {
                _id: doc.id,
                name: data.name,
                image: data.image
              };
            });
        }
        
        // Populate bottomChefs
        if (challenge.bottomChefs && challenge.bottomChefs.length > 0) {
          const bottomChefDocs = await Promise.all(
            (challenge.bottomChefs as string[]).map(chefId => getDoc(doc(db, 'chefs', chefId)))
          );
          
          challenge.bottomChefs = bottomChefDocs
            .filter(doc => doc.exists())
            .map(doc => {
              const data = doc.data();
              return {
                _id: doc.id,
                name: data.name,
                image: data.image
              };
            });
        }
        
        // Populate eliminatedChef
        if (challenge.eliminatedChef) {
          const eliminatedChefDoc = await getDoc(doc(db, 'chefs', challenge.eliminatedChef as string));
          if (eliminatedChefDoc.exists()) {
            const eliminatedData = eliminatedChefDoc.data();
            challenge.eliminatedChef = {
              _id: eliminatedChefDoc.id,
              name: eliminatedData.name,
              image: eliminatedData.image
            };
          }
        }
      }
      
      return challenges;
    } catch (error) {
      console.error('Error fetching challenges from Firestore:', error);
      
      // Fallback to API
      const response = await api.get('/challenges', { params: { season } });
      return response.data;
    }
  },
  
  // Get a challenge by ID
  getChallengeById: async (id: string): Promise<Challenge> => {
    try {
      const challengeDoc = await getDoc(doc(db, 'challenges', id));
      
      if (!challengeDoc.exists()) {
        throw new Error('Challenge not found');
      }
      
      const challenge = {
        _id: challengeDoc.id,
        ...challengeDoc.data()
      } as Challenge;
      
      // Populate chef references (same as in getAllChallenges)
      if (challenge.winner && typeof challenge.winner === 'string') {
        const winnerDoc = await getDoc(doc(db, 'chefs', challenge.winner));
        if (winnerDoc.exists()) {
          const winnerData = winnerDoc.data();
          challenge.winner = {
            _id: winnerDoc.id,
            name: winnerData.name,
            image: winnerData.image
          };
        }
      }
      
      if (challenge.topChefs && challenge.topChefs.length > 0) {
        const topChefDocs = await Promise.all(
          (challenge.topChefs as string[]).map(chefId => getDoc(doc(db, 'chefs', chefId)))
        );
        
        challenge.topChefs = topChefDocs
          .filter(doc => doc.exists())
          .map(doc => {
            const data = doc.data();
            return {
              _id: doc.id,
              name: data.name,
              image: data.image
            };
          });
      }
      
      if (challenge.bottomChefs && challenge.bottomChefs.length > 0) {
        const bottomChefDocs = await Promise.all(
          (challenge.bottomChefs as string[]).map(chefId => getDoc(doc(db, 'chefs', chefId)))
        );
        
        challenge.bottomChefs = bottomChefDocs
          .filter(doc => doc.exists())
          .map(doc => {
            const data = doc.data();
            return {
              _id: doc.id,
              name: data.name,
              image: data.image
            };
          });
      }
      
      if (challenge.eliminatedChef && typeof challenge.eliminatedChef === 'string') {
        const eliminatedChefDoc = await getDoc(doc(db, 'chefs', challenge.eliminatedChef));
        if (eliminatedChefDoc.exists()) {
          const eliminatedData = eliminatedChefDoc.data();
          challenge.eliminatedChef = {
            _id: eliminatedChefDoc.id,
            name: eliminatedData.name,
            image: eliminatedData.image
          };
        }
      }
      
      return challenge;
    } catch (error) {
      console.error('Error fetching challenge from Firestore:', error);
      
      // Fallback to API
      const response = await api.get(`/challenges/${id}`);
      return response.data;
    }
  },
  
  // Get current challenges
  getCurrentChallenges: async (season: number | string): Promise<Challenge[]> => {
    try {
      if (!season) {
        throw new Error('Season parameter is required');
      }
      
      const seasonNum = typeof season === 'string' ? parseInt(season) : season;
      
      // First, find the latest challenge by airDate
      const latestChallengeQuery = query(
        collection(db, 'challenges'),
        where('season', '==', seasonNum),
        orderBy('airDate', 'desc'),
        limit(1)
      );
      
      const latestChallengeSnapshot = await getDocs(latestChallengeQuery);
      
      if (latestChallengeSnapshot.empty) {
        throw new Error('No challenges found for this season');
      }
      
      const latestChallenge = {
        _id: latestChallengeSnapshot.docs[0].id,
        ...latestChallengeSnapshot.docs[0].data()
      } as Challenge;
      
      // Get all challenges from the same week
      const currentChallengesQuery = query(
        collection(db, 'challenges'),
        where('season', '==', seasonNum),
        where('week', '==', latestChallenge.week)
      );
      
      const currentChallengesSnapshot = await getDocs(currentChallengesQuery);
      
      const currentChallenges = currentChallengesSnapshot.docs.map(doc => ({
        _id: doc.id,
        ...doc.data()
      })) as Challenge[];
      
      // Sort challenges by quickfire first, then airDate
      currentChallenges.sort((a, b) => {
        if (a.isQuickfire !== b.isQuickfire) {
          return a.isQuickfire ? -1 : 1;
        }
        return new Date(a.airDate).getTime() - new Date(b.airDate).getTime();
      });
      
      // For each challenge, populate chef references (same as in getAllChallenges)
      for (const challenge of currentChallenges) {
        // Populate winner
        if (challenge.winner && typeof challenge.winner === 'string') {
          const winnerDoc = await getDoc(doc(db, 'chefs', challenge.winner));
          if (winnerDoc.exists()) {
            const winnerData = winnerDoc.data();
            challenge.winner = {
              _id: winnerDoc.id,
              name: winnerData.name,
              image: winnerData.image
            };
          }
        }
        
        // Populate topChefs
        if (challenge.topChefs && challenge.topChefs.length > 0) {
          const topChefDocs = await Promise.all(
            (challenge.topChefs as string[]).map(chefId => getDoc(doc(db, 'chefs', chefId)))
          );
          
          challenge.topChefs = topChefDocs
            .filter(doc => doc.exists())
            .map(doc => {
              const data = doc.data();
              return {
                _id: doc.id,
                name: data.name,
                image: data.image
              };
            });
        }
        
        // Populate bottomChefs
        if (challenge.bottomChefs && challenge.bottomChefs.length > 0) {
          const bottomChefDocs = await Promise.all(
            (challenge.bottomChefs as string[]).map(chefId => getDoc(doc(db, 'chefs', chefId)))
          );
          
          challenge.bottomChefs = bottomChefDocs
            .filter(doc => doc.exists())
            .map(doc => {
              const data = doc.data();
              return {
                _id: doc.id,
                name: data.name,
                image: data.image
              };
            });
        }
        
        // Populate eliminatedChef
        if (challenge.eliminatedChef && typeof challenge.eliminatedChef === 'string') {
          const eliminatedChefDoc = await getDoc(doc(db, 'chefs', challenge.eliminatedChef));
          if (eliminatedChefDoc.exists()) {
            const eliminatedData = eliminatedChefDoc.data();
            challenge.eliminatedChef = {
              _id: eliminatedChefDoc.id,
              name: eliminatedData.name,
              image: eliminatedData.image
            };
          }
        }
      }
      
      return currentChallenges;
    } catch (error) {
      console.error('Error fetching current challenges from Firestore:', error);
      
      // Fallback to API
      const response = await api.get('/challenges/current', { params: { season } });
      return response.data;
    }
  },
  
  // Create a challenge (admin only)
  createChallenge: async (challengeData: Partial<Challenge>): Promise<Challenge> => {
    // For admin operations, stick with API approach for security
    const response = await api.post('/challenges', challengeData);
    return response.data;
  },
  
  // Update a challenge (admin only)
  updateChallenge: async (id: string, updateData: Partial<Challenge>): Promise<Challenge> => {
    // For admin operations, stick with API approach for security
    const response = await api.put(`/challenges/${id}`, updateData);
    return response.data;
  }
};

export default ChallengeService;