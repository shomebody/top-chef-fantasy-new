import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth.jsx';

export const EVENTS = {
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  JOIN_LEAGUE: 'join_league',
  LEAVE_LEAGUE: 'leave_league',
  SEND_MESSAGE: 'send_message',
  CHAT_MESSAGE: 'chat_message',
  USER_TYPING: 'user_typing',
  USER_JOINED: 'user_joined',
  USER_LEFT: 'user_left',
  CHEF_UPDATE: 'chef_update',
  LEAGUE_UPDATE: 'league_update',
  SCORE_UPDATE: 'score_update'
};

export const SocketContext = createContext({
  socket: null,
  connected: false,
  EVENTS,
  joinLeague: () => {},
  leaveLeague: () => {},
  sendMessage: () => {},
  sendTyping: () => {}
});

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    
    const getToken = async () => {
      try {
        // If using Firebase Auth, get the auth token
        return await auth.currentUser?.getIdToken();
      } catch (error) {
        console.error('Error getting auth token:', error);
        return localStorage.getItem('token'); // Fallback to stored token
      }
    };
    
    const setupSocket = async () => {
      const token = await getToken();
      
      const socketInstance = io(socketUrl, {
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      socketInstance.on('connect', () => {
        console.log('Socket connected');
        setConnected(true);
      });

      socketInstance.on('disconnect', () => {
        console.log('Socket disconnected');
        setConnected(false);
      });

      socketInstance.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setConnected(false);
      });

      setSocket(socketInstance);
      
      return socketInstance;
    };
    
    let socketInstance;
    setupSocket().then(instance => {
      socketInstance = instance;
    });

    return () => {
      console.log('Cleaning up socket connection');
      if (socketInstance) {
        socketInstance.disconnect();
      }
      setSocket(null);
      setConnected(false);
    };
  }, [isAuthenticated, user]);

  const joinLeague = useCallback((leagueId) => {
    if (socket && connected && leagueId) {
      console.log(`Joining league: ${leagueId}`);
      socket.emit(EVENTS.JOIN_LEAGUE, { leagueId });
    }
  }, [socket, connected]);

  const leaveLeague = useCallback((leagueId) => {
    if (socket && connected && leagueId) {
      console.log(`Leaving league: ${leagueId}`);
      socket.emit(EVENTS.LEAVE_LEAGUE, { leagueId });
    }
  }, [socket, connected]);

  const sendMessage = useCallback((message) => {
    if (socket && connected && message) {
      console.log('Sending message:', message);
      socket.emit(EVENTS.SEND_MESSAGE, message);
    }
  }, [socket, connected]);

  const sendTyping = useCallback((leagueId) => {
    if (socket && connected && leagueId) {
      socket.emit(EVENTS.USER_TYPING, { leagueId });
    }
  }, [socket, connected]);

  const contextValue = useMemo(() => ({
    socket,
    connected,
    EVENTS,
    joinLeague,
    leaveLeague,
    sendMessage,
    sendTyping
  }), [socket, connected, joinLeague, leaveLeague, sendMessage, sendTyping]);

  return (
    <SocketContext value={contextValue}>
      {children}
    </SocketContext>
  );
};