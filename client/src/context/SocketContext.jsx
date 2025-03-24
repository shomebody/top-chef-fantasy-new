import React, { createContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth.jsx';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { isAuthenticated, user } = useAuth();

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

  // Socket event constants
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

  // Join a league channel
  const joinLeague = (leagueId) => {
    if (socket && connected) {
      socket.emit(EVENTS.JOIN_LEAGUE, { leagueId });
    }
  };

  // Leave a league channel
  const leaveLeague = (leagueId) => {
    if (socket && connected) {
      socket.emit(EVENTS.LEAVE_LEAGUE, { leagueId });
    }
  };

  // Send a message to a league
  const sendMessage = (message) => {
    if (socket && connected) {
      socket.emit(EVENTS.SEND_MESSAGE, message);
    }
  };

  // Indicate typing in a channel
  const sendTyping = (leagueId) => {
    if (socket && connected) {
      socket.emit(EVENTS.USER_TYPING, { leagueId });
    }
  };

  const contextValue = {
    socket,
    connected,
    EVENTS,
    joinLeague,
    leaveLeague,
    sendMessage,
    sendTyping
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

