// client/src/context/SocketContext.jsx
import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth.jsx';

// Socket events - consistent naming for both client and server
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

// Create context with default values
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

  // Initialize socket connection
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    
    // Initialize socket with auth token
    const socketInstance = io(socketUrl, {
      auth: {
        token: localStorage.getItem('token')
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    // Set up event listeners
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

    // Save socket instance
    setSocket(socketInstance);

    // Cleanup function
    return () => {
      console.log('Cleaning up socket connection');
      socketInstance.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [isAuthenticated, user]);

  // Join a league room
  const joinLeague = useCallback((leagueId) => {
    if (socket && connected && leagueId) {
      console.log(`Joining league: ${leagueId}`);
      socket.emit(EVENTS.JOIN_LEAGUE, { leagueId });
    }
  }, [socket, connected]);

  // Leave a league room
  const leaveLeague = useCallback((leagueId) => {
    if (socket && connected && leagueId) {
      console.log(`Leaving league: ${leagueId}`);
      socket.emit(EVENTS.LEAVE_LEAGUE, { leagueId });
    }
  }, [socket, connected]);

  // Send a chat message
  const sendMessage = useCallback((message) => {
    if (socket && connected && message) {
      console.log('Sending message:', message);
      socket.emit(EVENTS.SEND_MESSAGE, message);
    }
  }, [socket, connected]);

  // Send typing indicator
  const sendTyping = useCallback((leagueId) => {
    if (socket && connected && leagueId) {
      socket.emit(EVENTS.USER_TYPING, { leagueId });
    }
  }, [socket, connected]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    socket,
    connected,
    EVENTS,
    joinLeague,
    leaveLeague,
    sendMessage,
    sendTyping
  }), [socket, connected, joinLeague, leaveLeague, sendMessage, sendTyping]);

  // Use React 19's new context API syntax
  return <SocketContext>{contextValue}{children}</SocketContext>;
};