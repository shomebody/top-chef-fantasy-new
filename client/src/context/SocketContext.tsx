// client/src/context/SocketContext.tsx
import { createContext, useState, useEffect, useMemo, useCallback, useContext, type ReactNode } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';
import { auth } from '../config/firebase';

// Singleton socket instance
let socketInstance: Socket | null = null;
const hasInitialized = { current: false };

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
} as const;

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  EVENTS: typeof EVENTS;
  joinLeague: (leagueId: string) => void;
  leaveLeague: (leagueId: string) => void;
  sendMessage: (message: any) => void;
  sendTyping: (leagueId: string) => void;
}

export const SocketContext = createContext<SocketContextType>({
  socket: null,
  connected: false,
  EVENTS,
  joinLeague: () => {},
  leaveLeague: () => {},
  sendMessage: () => {},
  sendTyping: () => {},
});

interface SocketProviderProps {
  children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(socketInstance);
  const [connected, setConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    console.log('SocketProvider effect running, user:', user ? user._id : 'none');

    if (!user?._id) {
      console.log('No authenticated user, not connecting to socket');
      if (socketInstance) {
        console.log('Disconnecting existing socket due to no user');
        socketInstance.disconnect();
        socketInstance = null;
        setSocket(null);
        setConnected(false);
        hasInitialized.current = false;
      }
      return;
    }

    if (hasInitialized.current && socketInstance?.connected) {
      console.log('Socket already connected, skipping initialization');
      setSocket(socketInstance);
      setConnected(true);
      return;
    }

    const connectSocket = async () => {
      try {
        const firebaseToken = await auth.currentUser?.getIdToken(true);
        if (!firebaseToken) {
          console.log('No Firebase token available');
          return;
        }

        console.log('Connecting to socket with Firebase token');
        const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
        const newSocket = io(socketUrl, {
          auth: { token: firebaseToken },
          reconnection: true,
          reconnectionAttempts: 5,
        });

        newSocket.on('connect', () => {
          console.log('Socket connected');
          setConnected(true);
        });

        newSocket.on('disconnect', () => {
          console.log('Socket disconnected');
          setConnected(false);
          hasInitialized.current = false;
        });

        newSocket.on('connect_error', (error) => {
          console.error('Socket connection failed:', error);
          setConnected(false);
        });

        socketInstance = newSocket;
        setSocket(newSocket);
        hasInitialized.current = true;
      } catch (err) {
        console.error('Error connecting socket:', err);
      }
    };

    connectSocket();

    return () => {
      // Only clean up on unmount, not on every effect run
    };
  }, [user?._id]);

  useEffect(() => {
    return () => {
      if (socketInstance && !user?._id) {
        console.log('Disconnecting socket on unmount');
        socketInstance.disconnect();
        socketInstance = null;
        setSocket(null);
        setConnected(false);
        hasInitialized.current = false;
      }
    };
  }, []); // Separate cleanup effect with no dependencies

  const joinLeague = useCallback((leagueId: string) => {
    if (socket && connected) {
      console.log(`Joining league socket: ${leagueId}`);
      socket.emit(EVENTS.JOIN_LEAGUE, { leagueId });
    }
  }, [socket, connected]);

  const leaveLeague = useCallback((leagueId: string) => {
    if (socket && connected) {
      console.log(`Leaving league socket: ${leagueId}`);
      socket.emit(EVENTS.LEAVE_LEAGUE, { leagueId });
    }
  }, [socket, connected]);

  const sendMessage = useCallback((message: any) => {
    if (socket && connected) {
      console.log('Sending message via socket');
      socket.emit(EVENTS.SEND_MESSAGE, message);
    }
  }, [socket, connected]);

  const sendTyping = useCallback((leagueId: string) => {
    if (socket && connected) {
      socket.emit(EVENTS.USER_TYPING, { leagueId });
    }
  }, [socket, connected]);

  const value = useMemo(
    () => ({
      socket,
      connected,
      EVENTS,
      joinLeague,
      leaveLeague,
      sendMessage,
      sendTyping,
    }),
    [socket, connected, joinLeague, leaveLeague, sendMessage, sendTyping]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};