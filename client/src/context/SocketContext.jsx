import { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth.jsx';

// Socket event constants
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
  SCORE_UPDATE: 'score_update'
};

// Create SocketContext with default values
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
  const { user } = useAuth();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const newSocket = io(socketUrl, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection failed:', error);
      setConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [user?._id]); // Triggers on login/logout when user._id changes

  const joinLeague = useCallback((leagueId) => {
    if (socket && connected) {
      socket.emit(EVENTS.JOIN_LEAGUE, { leagueId });
    }
  }, [socket, connected]);

  const leaveLeague = useCallback((leagueId) => {
    if (socket && connected) {
      socket.emit(EVENTS.LEAVE_LEAGUE, { leagueId });
    }
  }, [socket, connected]);

  const sendMessage = useCallback((message) => {
    if (socket && connected) {
      socket.emit(EVENTS.SEND_MESSAGE, message);
    }
  }, [socket, connected]);

  const sendTyping = useCallback((leagueId) => {
    if (socket && connected) {
      socket.emit(EVENTS.USER_TYPING, { leagueId });
    }
  }, [socket, connected]);

  const value = useMemo(() => ({
    socket,
    connected,
    EVENTS,
    joinLeague,
    leaveLeague,
    sendMessage,
    sendTyping
  }), [socket, connected, joinLeague, leaveLeague, sendMessage, sendTyping]);

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};