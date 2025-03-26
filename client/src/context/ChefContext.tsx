// client/src/context/ChefContext.tsx
import { createContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { collection, query, orderBy, onSnapshot, doc, getDoc, type Unsubscribe } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import type { ChefData } from './LeagueContext';

interface ChefContextProps {
  chefs: ChefData[];
  activeChefs: ChefData[];
  eliminatedChefs: ChefData[];
  loading: boolean;
  error: string | null;
  getChefById: (id: string) => Promise<ChefData>;
  refreshChefs: () => Promise<void>;
}

export const ChefContext = createContext<ChefContextProps>({
  chefs: [],
  activeChefs: [],
  eliminatedChefs: [],
  loading: true,
  error: null,
  getChefById: async () => ({
    _id: '',
    name: '',
    bio: '',
    hometown: '',
    specialty: '',
    image: '',
    status: 'active',
    eliminationWeek: null,
    stats: {
      wins: 0,
      eliminations: 0,
      quickfireWins: 0,
      challengeWins: 0,
      totalPoints: 0
    },
    weeklyPerformance: []
  }),
  refreshChefs: async () => {},
});

interface ChefProviderProps {
  children: ReactNode;
}

export function ChefProvider({ children }: ChefProviderProps) {
  const [chefs, setChefs] = useState<ChefData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const fetchChefs = useCallback(async (): Promise<Unsubscribe> => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching chefs data from Firestore');
      
      const chefsQuery = query(
        collection(db, 'chefs'),
        orderBy('stats.totalPoints', 'desc')
      );
      
      const unsubscribe = onSnapshot(chefsQuery, (snapshot) => {
        const chefData: ChefData[] = [];
        
        snapshot.forEach(doc => {
          const data = doc.data();
          chefData.push({
            _id: doc.id,
            name: data.name || '',
            bio: data.bio || '',
            hometown: data.hometown || '',
            specialty: data.specialty || '',
            image: data.image || '',
            status: (data.status as 'active' | 'eliminated' | 'winner') || 'active',
            eliminationWeek: data.eliminationWeek ?? null,
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

        console.log(`Loaded ${chefData.length} chefs`);
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
      return () => {}; // Return a no-op function instead of void
    }
  }, []);

  const getChefById = useCallback(async (id: string): Promise<ChefData> => {
    try {
      console.log(`Fetching chef by ID: ${id}`);
      const chefDoc = await getDoc(doc(db, 'chefs', id));
      
      if (!chefDoc.exists()) {
        throw new Error('Chef not found');
      }
      
      const data = chefDoc.data();
      return {
        _id: chefDoc.id,
        name: data.name || '',
        bio: data.bio || '',
        hometown: data.hometown || '',
        specialty: data.specialty || '',
        image: data.image || '',
        status: (data.status as 'active' | 'eliminated' | 'winner') || 'active',
        eliminationWeek: data.eliminationWeek ?? null,
        stats: data.stats || {
          wins: 0,
          eliminations: 0,
          quickfireWins: 0,
          challengeWins: 0,
          totalPoints: 0
        },
        weeklyPerformance: data.weeklyPerformance || []
      };
    } catch (error) {
      console.error('Error fetching chef by ID:', error);
      setError('Failed to load chef details');
      throw error;
    }
  }, []);

  useEffect(() => {
    let unsubscribe: Unsubscribe = () => {};
    
    if (isAuthenticated) {
      console.log('Setting up chefs listener');
      fetchChefs()
        .then(unsub => {
          unsubscribe = unsub;
        })
        .catch(err => {
          console.error('Failed to set up chef listener:', err);
          setError('Failed to load chefs data');
        });
    }
    
    return () => {
      console.log('Cleaning up chefs listener');
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
    refreshChefs: async () => {
      await fetchChefs();
    }
  }), [chefs, activeChefs, eliminatedChefs, loading, error, getChefById, fetchChefs]);

  return (
    <ChefContext.Provider value={value}>
      {children}
    </ChefContext.Provider>
  );
}