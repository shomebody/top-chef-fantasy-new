import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { useSocket } from '../hooks/useSocket.jsx';
import api from '../services/api.js';

export const LeagueContext = createContext({
  leagues: [],
  currentLeague: null,
  chefs: [],
  leaderboard: [],
  challenges: [],
  loading: true,
  error: null,
  fetchUserLeagues: () => {},
  fetchLeagueDetails: () => {},
  createLeague: () => {},
  joinLeagueWithCode: () => {},
  switchLeague: (value) => {},
  updateLeague: () => {},
});

export const LeagueProvider = ({ children }) => {
  const [leagues, setLeagues] = useState([]);
  const [currentLeague, setCurrentLeague] = useState(null);
  const [chefs, setChefs] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { user = null, isAuthenticated = false } = useAuth();
  const { socket = null, connected = false, EVENTS = { LEAGUE_UPDATE: 'league_update', SCORE_UPDATE: 'score_update' }, joinLeague = () => {} } = useSocket();

  // Load user's leagues
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserLeagues()
        .catch(err => {
          console.error('Failed to load leagues:', err);
          setError('Failed to load your leagues. Please refresh the page.');
        });
    }
  }, [isAuthenticated]);

  // Listen for league updates from socket
  useEffect(() => {
    if (socket && connected && currentLeague?._id) {
      joinLeague(currentLeague._id);

      const handleLeagueUpdate = (data) => {
        if (data.leagueId === currentLeague._id) {
          setCurrentLeague((prev) => ({ ...prev, ...data.updates }));
          if (data.updates.members) {
            fetchLeagueDetails(currentLeague._id)
              .catch(err => console.error('Error refreshing league details:', err));
          }
        }
      };

      const handleScoreUpdate = (data) => {
        if (data.leagueId === currentLeague._id) {
          setLeaderboard((prevLeaderboard) =>
            prevLeaderboard
              .map((item) =>
                item.user._id === data.userId ? { ...item, score: data.newScore } : item
              )
              .sort((a, b) => b.score - a.score)
          );
        }
      };

      socket.on(EVENTS.LEAGUE_UPDATE || 'league_update', handleLeagueUpdate);
      socket.on(EVENTS.SCORE_UPDATE || 'score_update', handleScoreUpdate);

      return () => {
        socket.off(EVENTS.LEAGUE_UPDATE || 'league_update', handleLeagueUpdate);
        socket.off(EVENTS.SCORE_UPDATE || 'score_update', handleScoreUpdate);
      };
    }
  }, [socket, connected, currentLeague, EVENTS, joinLeague]);

  const fetchUserLeagues = async () => {
    try {
      setLoading(true);
      const response = await api.get('/leagues');
      setLeagues(response.data);

      if (response.data.length > 0 && !currentLeague) {
        setCurrentLeague(response.data[0]);
      }

      setError(null);
      return response.data;
    } catch (err) {
      console.error('Error fetching leagues:', err);
      setError('Failed to load your leagues');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchLeagueDetails = useCallback(async (leagueId) => {
    try {
      setLoading(true);

      const leagueResponse = await api.get(`/leagues/${leagueId}`);
      setCurrentLeague(leagueResponse.data);

      const chefsResponse = await api.get('/chefs');
      setChefs(chefsResponse.data);

      const leaderboardResponse = await api.get(`/leagues/${leagueId}/leaderboard`);
      setLeaderboard(leaderboardResponse.data);

      const challengesResponse = await api.get('/challenges', {
        params: { season: leagueResponse.data.season },
      });
      setChallenges(challengesResponse.data);

      setError(null);
      return leagueResponse.data;
    } catch (err) {
      console.error('Error fetching league details:', err.response?.data || err.message);
      setError('Failed to load league details');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createLeague = async (leagueData) => {
    try {
      setLoading(true);
      const response = await api.post('/leagues', leagueData);
      setLeagues([...leagues, response.data]);
      setCurrentLeague(response.data);
      setError(null);
      return response.data;
    } catch (err) {
      console.error('Error creating league:', err.response?.data || err.message);
      setError('Failed to create league');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const joinLeagueWithCode = async (inviteCode) => {
    try {
      setLoading(true);
      const response = await api.post('/leagues/join', { inviteCode });
      setLeagues([...leagues, response.data]);
      setCurrentLeague(response.data);
      setError(null);
      return response.data;
    } catch (err) {
      console.error('Error joining league:', err.response?.data || err.message);
      setError('Failed to join league');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const switchLeague = (leagueId) => {
    const league = leagues.find((l) => l._id === leagueId);
    if (league) {
      setCurrentLeague(league);
      fetchLeagueDetails(leagueId)
        .catch(err => {
          console.error('Error switching league:', err);
          setError('Failed to load league details');
        });
    }
  };

  const updateLeague = async (leagueId, updateData) => {
    try {
      setLoading(true);
      const response = await api.put(`/leagues/${leagueId}`, updateData);
      
      // Update the leagues list
      setLeagues(leagues.map(league => 
        league._id === leagueId ? response.data : league
      ));
      
      // Update current league if it's the one being updated
      if (currentLeague?._id === leagueId) {
        setCurrentLeague(response.data);
      }
      
      setError(null);
      return response.data;
    } catch (err) {
      console.error('Error updating league:', err.response?.data || err.message);
      setError('Failed to update league');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const contextValue = {
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
    updateLeague
  };

  return <LeagueContext.Provider value={contextValue}>{children}</LeagueContext.Provider>;
};