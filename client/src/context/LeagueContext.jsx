import React, { createContext, useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { useSocket } from '../hooks/useSocket.jsx';
import api from '../services/api.js';

export const LeagueContext = createContext();

export const LeagueProvider = ({ children }) => {
  const [leagues, setLeagues] = useState([]);
  const [currentLeague, setCurrentLeague] = useState(null);
  const [chefs, setChefs] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { user, isAuthenticated } = useAuth();
  const { socket, connected, EVENTS, joinLeague } = useSocket();

  // Load user's leagues
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserLeagues();
    }
  }, [isAuthenticated]);

  // Listen for league updates from socket
  useEffect(() => {
    if (socket && connected && currentLeague) {
      joinLeague(currentLeague._id);

      socket.on(EVENTS.LEAGUE_UPDATE, handleLeagueUpdate);
      socket.on(EVENTS.SCORE_UPDATE, handleScoreUpdate);

      return () => {
        socket.off(EVENTS.LEAGUE_UPDATE, handleLeagueUpdate);
        socket.off(EVENTS.SCORE_UPDATE, handleScoreUpdate);
      };
    }
  }, [socket, connected, currentLeague]);

  const fetchUserLeagues = async () => {
    try {
      setLoading(true);
      const response = await api.get('/leagues');
      setLeagues(response.data);

      if (response.data.length > 0 && !currentLeague) {
        setCurrentLeague(response.data[0]);
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching leagues:', err);
      setError('Failed to load your leagues');
    } finally {
      setLoading(false);
    }
  };

  const fetchLeagueDetails = async (leagueId) => {
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
    } catch (err) {
      console.error('Error fetching league details:', err.response?.data || err.message);
      setError('Failed to load league details');
    } finally {
      setLoading(false);
    }
  };

  const handleLeagueUpdate = (data) => {
    if (data.leagueId === currentLeague?._id) {
      setCurrentLeague((prev) => ({ ...prev, ...data.updates }));
      if (data.updates.members) {
        fetchLeagueDetails(currentLeague._id);
      }
    }
  };

  const handleScoreUpdate = (data) => {
    if (data.leagueId === currentLeague?._id) {
      setLeaderboard((prevLeaderboard) =>
        prevLeaderboard
          .map((item) =>
            item.user._id === data.userId ? { ...item, score: data.newScore } : item
          )
          .sort((a, b) => b.score - a.score)
      );
    }
  };

  const createLeague = async (leagueData) => {
    try {
      setLoading(true);
      const response = await api.post('/leagues', leagueData);
      setLeagues([...leagues, response.data]);
      setCurrentLeague(response.data);
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
      fetchLeagueDetails(leagueId);
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
  };

  return <LeagueContext.Provider value={contextValue}>{children}</LeagueContext.Provider>;
};