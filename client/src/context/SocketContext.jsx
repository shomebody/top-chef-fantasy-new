// client/src/context/SocketContext.jsx
import React, { createContext, useState, useEffect, useMemo } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth.jsx';

// Create context with complete default values
export const SocketContext = createContext({
  socket: null,
  connected: false,
  EVENTS: {
    JOIN_LEAGUE: 'join_league',
    LEAVE_LEAGUE: 'leave_league',
    SEND_MESSAGE: 'send_message',
    CHAT_MESSAGE: 'chat_message',
    CHEF_UPDATE: 'chef_update',
    LEAGUE_UPDATE: 'league_update',
    USER_TYPING: 'user_typing',
    USER_JOINED: 'user_joined',
    USER_LEFT: 'user_left',
    SCORE_UPDATE: 'score_update'
  },
  joinLeague: (leagueId) => {},
  leaveLeague: (leagueId) => {},
  sendMessage: (message) => {},
  sendTyping: (leagueId) => {}
});

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { isAuthenticated = false, user = null } = useAuth();

  // Socket event constants - moved outside component for performance
  const EVENTS = {
    JOIN_LEAGUE: 'join_league',
    LEAVE_LEAGUE: 'leave_league',
    SEND_MESSAGE: 'send_message',
    CHAT_MESSAGE: 'chat_message',
    CHEF_UPDATE: 'chef_update',
    LEAGUE_UPDATE: 'league_update',
    USER_TYPING: 'user_typing',
    USER_JOINED: 'user_joined',
    USER_LEFT: 'user_left',
    SCORE_UPDATE: 'score_update'
  };

  useEffect(() => {
    let socketInstance = null;

    if (isAuthenticated && user) {
      const token = localStorage.getItem('token');
      
      // Create socket connection
      socketInstance = io(import.meta.env.VITE_SOCKET_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true
      });
      
      // Socket events
      socketInstance.on('connect', () => {
        console.log('Socket connected');
        setConnected(true);
      });
      
      socketInstance.on('disconnect', () => {
        console.log('Socket disconnected');
        setConnected(false);
      });
      
      socketInstance.on('connect_error', (err) => {
        console.error('Socket connection error:', err.message);
        setConnected(false);
      });
      
      setSocket(socketInstance);
    }
    
    // Cleanup function
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
        setSocket(null);
        setConnected(false);
      }
    };
  }, [isAuthenticated, user]);

  // Methods with proper parameter types
  const joinLeague = (leagueId) => {
    if (socket && connected && leagueId) {
      socket.emit(EVENTS.JOIN_LEAGUE, { leagueId });
    }
  };

  const leaveLeague = (leagueId) => {
    if (socket && connected && leagueId) {
      socket.emit(EVENTS.LEAVE_LEAGUE, { leagueId });
    }
  };

  const sendMessage = (message) => {
    if (socket && connected && message) {
      socket.emit(EVENTS.SEND_MESSAGE, message);
    }
  };

  const sendTyping = (leagueId) => {
    if (socket && connected && leagueId) {
      socket.emit(EVENTS.USER_TYPING, { leagueId });
    }
  };

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    socket,
    connected,
    EVENTS,
    joinLeague,
    leaveLeague,
    sendMessage,
    sendTyping
  }), [socket, connected]);

  // Using React 19 Context syntax
  return <SocketContext value={contextValue}>{children}</SocketContext>;
}