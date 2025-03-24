// client/src/context/SocketContext.jsx
import React, { createContext, useState, useEffect, useMemo } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth.jsx'; // Assuming .jsx or adjusted import

// Socket event constants (mirroring server)
export const EVENTS = {
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  JOIN_LEAGUE: 'join_league',
  LEAVE_LEAGUE: 'leave_league',
  SEND_MESSAGE: 'send_message',
  CHAT_MESSAGE: 'chat_message',
  CHEF_UPDATE: 'chef_update',
  LEAGUE_UPDATE: 'league_update',
  USER_TYPING: 'user_typing',
  USER_JOINED: 'user_joined',
  USER_LEFT: 'user_left',
  SCORE_UPDATE: 'score_update',
};

// Create context with default values
export const SocketContext = createContext({
  socket: null,
  isConnected: false,
  joinLeague: () => {},
  leaveLeague: () => {},
  sendMessage: () => {},
  sendTypingIndicator: () => {},
});

// Socket Provider Component
export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { getToken } = useAuth();

  // Initialize socket connection
  useEffect(() => {
    const token = getToken();
    if (!token) return; // Wait for auth token

    const newSocket = io(process.env.VITE_SERVER_URL || 'http://localhost:5000', {
      auth: { token },
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
    });

    newSocket.on(EVENTS.CONNECTION, () => {
      setIsConnected(true);
      console.log('Socket connected:', newSocket.id);
    });

    newSocket.on(EVENTS.DISCONNECT, () => {
      setIsConnected(false);
      console.log('Socket disconnected');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
      setSocket(null);
      setIsConnected(false);
    };
  }, [getToken]); // Depend on getToken to re-run if token changes

  // Join a league
  const joinLeague = (leagueId) => {
    if (socket && isConnected) {
      socket.emit(EVENTS.JOIN_LEAGUE, { leagueId });
    }
  };

  // Leave a league
  const leaveLeague = (leagueId) => {
    if (socket && isConnected) {
      socket.emit(EVENTS.LEAVE_LEAGUE, { leagueId });
    }
  };

  // Send a message
  const sendMessage = (message) => {
    if (socket && isConnected) {
      socket.emit(EVENTS.SEND_MESSAGE, { ...message, type: message.type || 'text' });
    }
  };

  // Send typing indicator
  const sendTypingIndicator = (leagueId) => {
    if (socket && isConnected) {
      socket.emit(EVENTS.USER_TYPING, { leagueId });
    }
  };

  // Define context value
  const contextValue = useMemo(() => ({
    socket,
    isConnected,
    joinLeague,
    leaveLeague,
    sendMessage,
    sendTypingIndicator,
  }), [socket, isConnected]);

  // Fixed provider with contextValue
  return <SocketContext.Provider value={contextValue}>{children}</SocketContext.Provider>;
}