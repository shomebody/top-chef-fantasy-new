import { collection, doc, getDocs, getDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import api from './api.js';

const ChefService = {
  // Get all chefs - Firestore implementation
  getAllChefs: async () => {
    try {
      const chefsQuery = query(
        collection(db, 'chefs'),
        orderBy('stats.totalPoints', 'desc')
      );
      
      const chefsSnapshot = await getDocs(chefsQuery);
      
      const chefs = chefsSnapshot.docs.map(doc => ({
        _id: doc.id,
        ...doc.data()
      }));
      
      return chefs;
    } catch (error) {
      console.error('Error fetching chefs from Firestore:', error);
      
      // Fallback to API
      const response = await api.get('/chefs');
      return response.data;
    }
  },
  
  // Get a chef by ID
  getChefById: async (id) => {
    try {
      const chefDoc = await getDoc(doc(db, 'chefs', id));
      
      if (!chefDoc.exists()) {
        throw new Error('Chef not found');
      }
      
      return {
        _id: chefDoc.id,
        ...chefDoc.data()
      };
    } catch (error) {
      console.error('Error fetching chef from Firestore:', error);
      
      // Fallback to API
      const response = await api.get(`/chefs/${id}`);
      return response.data;
    }
  },
  
  // Get chef stats
  getChefStats: async (id) => {
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
  getChefWeeklyPerformance: async (id) => {
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