import { collection, doc, getDoc, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../config/firebase.js';
import api from './api.js';

interface ChefData {
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

const ChefService = {
  // Get all chefs - Firestore implementation
  getAllChefs: async (): Promise<ChefData[]> => {
    try {
      const chefsQuery = query(
        collection(db, 'chefs'),
        orderBy('stats.totalPoints', 'desc')
      );
      
      const chefsSnapshot = await getDocs(chefsQuery);
      
      const chefs = chefsSnapshot.docs.map(doc => ({
        _id: doc.id,
        ...doc.data()
      })) as ChefData[];
      
      return chefs;
    } catch (error) {
      console.error('Error fetching chefs from Firestore:', error);
      
      // Fallback to API
      const response = await api.get('/chefs');
      return response.data;
    }
  },
  
  // Get a chef by ID
  getChefById: async (id: string): Promise<ChefData> => {
    try {
      const chefDoc = await getDoc(doc(db, 'chefs', id));
      
      if (!chefDoc.exists()) {
        throw new Error('Chef not found');
      }
      
      return {
        _id: chefDoc.id,
        ...chefDoc.data()
      } as ChefData;
    } catch (error) {
      console.error('Error fetching chef from Firestore:', error);
      
      // Fallback to API
      const response = await api.get(`/chefs/${id}`);
      return response.data;
    }
  },
  
  // Get chef stats
  getChefStats: async (id: string): Promise<any> => {
    try {
      const chefDoc = await getDoc(doc(db, 'chefs', id));
      
      if (!chefDoc.exists()) {
        throw new Error('Chef not found');
      }
      
      const chef = chefDoc.data();
      return chef.stats || {};
    } catch (error) {
      console.error('Error fetching chef stats from Firestore:', error);
      
      // Fallback to API
      const response = await api.get(`/chefs/${id}/stats`);
      return response.data;
    }
  },
  
  // Get weekly performance
  getChefWeeklyPerformance: async (id: string): Promise<any[]> => {
    try {
      const chefDoc = await getDoc(doc(db, 'chefs', id));
      
      if (!chefDoc.exists()) {
        throw new Error('Chef not found');
      }
      
      const chef = chefDoc.data();
      return chef.weeklyPerformance || [];
    } catch (error) {
      console.error('Error fetching chef weekly performance from Firestore:', error);
      
      // Fallback to API
      const response = await api.get(`/chefs/${id}/weekly-performance`);
      return response.data;
    }
  }
};

export default ChefService;