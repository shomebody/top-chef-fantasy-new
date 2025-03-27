// client/src/context/SocketContext.tsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react';
import { io, type Socket } from 'socket.io-client';
import { auth } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';

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
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const connectAttempts = useRef(0);
  
  // Clean up function for socket connection
  const cleanupSocket = useCallback(() => {
    if (socketRef.current) {
      console.log('Cleaning up socket connection');
      
      // Remove all listeners to prevent memory leaks
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setConnected(false);
    }
  }, []);

  // Initialize socket connection
  useEffect(() => {
    if (!isAuthenticated || !user?._id) {
      cleanupSocket();
      return;
    }

    // Create new socket connection
    const initSocket = async () => {
      try {
        // Get a fresh token for authentication
        const firebaseToken = await auth.currentUser?.getIdToken(true);
        if (!firebaseToken) {
          console.error('No Firebase token available');
          return;
        }

        console.log('Initializing socket connection');
        
        // Clean up any existing socket
        cleanupSocket();
        
        // Create new socket instance
        const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
        const newSocket = io(socketUrl, {
          auth: { token: firebaseToken },
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          transports: ['websocket', 'polling'],
        });

        // Setup event listeners
        newSocket.on('connect', () => {
          console.log('Socket connected');
          setConnected(true);
          connectAttempts.current = 0;
        });

        newSocket.on('disconnect', () => {
          console.log('Socket disconnected');
          setConnected(false);
        });

        newSocket.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
          
          // Implement exponential backoff for reconnection
          connectAttempts.current += 1;
          if (connectAttempts.current > 5) {
            console.log('Max reconnection attempts reached');
            cleanupSocket();
          }
        });

        // Store the socket in ref and state
        socketRef.current = newSocket;
        setSocket(newSocket);
      } catch (err) {
        console.error('Error initializing socket:', err);
      }
    };

    initSocket();

    // Cleanup on unmount or when authentication changes
    return cleanupSocket;
  }, [isAuthenticated, user?._id, cleanupSocket]);

  // Token refresh handler
  useEffect(() => {
    if (!isAuthenticated || !socketRef.current) return;
    
    // Set up a token refresh interval
    const tokenRefreshInterval = setInterval(async () => {
      try {
        const freshToken = await auth.currentUser?.getIdToken(true);
        if (freshToken && socketRef.current) {
          // Emit a token refresh event (server needs to implement this)
          socketRef.current.emit('token_refresh', { token: freshToken });
        }
      } catch (err) {
        console.error('Token refresh error:', err);
      }
    }, 55 * 60 * 1000); // Refresh token every 55 minutes (tokens expire after 60 min)
    
    return () => {
      clearInterval(tokenRefreshInterval);
    };
  }, [isAuthenticated]);

  // Socket actions
  const joinLeague = useCallback((leagueId: string) => {
    if (socketRef.current && connected) {
      console.log(`Joining league socket: ${leagueId}`);
      socketRef.current.emit(EVENTS.JOIN_LEAGUE, { leagueId });
    } else {
      console.warn('Socket not connected - cannot join league');
    }
  }, [connected]);

  const leaveLeague = useCallback((leagueId: string) => {
    if (socketRef.current && connected) {
      console.log(`Leaving league socket: ${leagueId}`);
      socketRef.current.emit(EVENTS.LEAVE_LEAGUE, { leagueId });
    }
  }, [connected]);

  const sendMessage = useCallback((message: any) => {
    if (socketRef.current && connected) {
      console.log('Sending message via socket');
      socketRef.current.emit(EVENTS.SEND_MESSAGE, message);
    } else {
      console.warn('Socket not connected - cannot send message');
    }
  }, [connected]);

  const sendTyping = useCallback((leagueId: string) => {
    if (socketRef.current && connected) {
      socketRef.current.emit(EVENTS.USER_TYPING, { leagueId });
    }
  }, [connected]);

  // Create context value with memoization
  const value = useMemo(
    () => ({
      socket: socketRef.current,
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