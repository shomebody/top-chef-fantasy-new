import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../hooks/useAuth.jsx';

export const ChefContext = createContext({
  chefs: [],
  activeChefs: [],
  eliminatedChefs: [],
  loading: true,
  error: null,
  getChefById: async () => ({}),
  refreshChefs: () => {},
});

export const ChefProvider = ({ children }) => {
  const [chefs, setChefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();

  const fetchChefs = useCallback(async () => {
    try {
      setLoading(true);
      const chefsQuery = query(
        collection(db, 'chefs'),
        orderBy('stats.totalPoints', 'desc')
      );
      
      const unsubscribe = onSnapshot(chefsQuery, (snapshot) => {
        const chefData = snapshot.docs.map(doc => ({
          _id: doc.id,
          ...doc.data()
        }));
        setChefs(chefData);
        setLoading(false);
        setError(null);
      }, (err) => {
        console.error('Error in chefs snapshot:', err);
        setError('Failed to load chefs data');
        setLoading(false);
      });
      
      return unsubscribe;
    } catch (err) {
      console.error('Error setting up chefs listener:', err);
      setError('Failed to load chefs data');
      setLoading(false);
    }
  }, []);

  const getChefById = useCallback(async (id) => {
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
      console.error('Error fetching chef by ID:', error);
      setError('Failed to load chef details');
      throw error;
    }
  }, []);

  useEffect(() => {
    let unsubscribe = () => {};
    
    if (isAuthenticated) {
      fetchChefs()
        .then(unsub => {
          unsubscribe = unsub || (() => {});
        })
        .catch(err => {
          console.error('Failed to set up chef listener:', err);
          setError('Failed to load chefs data');
        });
    }
    
    return () => {
      unsubscribe();
    };
  }, [isAuthenticated, fetchChefs]);

  const activeChefs = useMemo(() => 
    chefs.filter(chef => chef.status === 'active'),
  [chefs]);

  const eliminatedChefs = useMemo(() => 
    chefs.filter(chef => chef.status === 'eliminated'),
  [chefs]);

  const value = useMemo(() => ({
    chefs,
    activeChefs,
    eliminatedChefs,
    loading,
    error,
    getChefById,
    refreshChefs: fetchChefs
  }), [chefs, activeChefs, eliminatedChefs, loading, error, getChefById, fetchChefs]);

  return (
    <ChefContext.Provider value={value}>
      {children}
    </ChefContext.Provider>
  );
};