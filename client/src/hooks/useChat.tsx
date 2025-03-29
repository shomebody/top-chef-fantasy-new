// client/src/hooks/useChat.tsx
import { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from './useAuth';
import { useSocket } from './useSocket';

// Define TypeScript interfaces
interface ChatMessage {
  _id: string;
  content: string;
  type: 'text' | 'system' | 'image';
  sender?: {
    _id: string;
    name: string;
  };
  createdAt: string;
  userId?: string;
  leagueId?: string;
}

interface TypingUser {
  userId: string;
  username: string;
}

interface UserEvent {
  userId: string;
  username: string;
  timestamp?: Date;
}

interface UseChatReturn {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  typingUsers: TypingUser[];
  sendMessage: (content: string, type?: string) => Promise<void>;
  sendTypingIndicator: () => void;
  refreshMessages: () => Promise<void>;
}

export function useChat(leagueId?: string): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

  const { socket, connected, EVENTS, joinLeague, leaveLeague, sendMessage: socketSendMessage, sendTyping } = useSocket();
  const { user } = useAuth();

  // Fetch chat history when leagueId changes
  const fetchMessages = useCallback(async () => {
    if (!leagueId) return;
    
    try {
      console.log(`Fetching messages for league: ${leagueId}`);
      setLoading(true);
      
      try {
        const response = await api.get(`/messages/${leagueId}`);
        setMessages(response.data.reverse()); // Newest messages at the bottom
        setError(null);
        console.log(`Loaded ${response.data.length} messages`);
      } catch (apiErr) {
        // Handle 404 gracefully - API endpoint might not be implemented yet
        if (apiErr.status === 404) {
          console.warn(`Message API endpoint not available yet for league: ${leagueId}`);
          setMessages([]); // Set empty messages instead of failing
          setError(null); // Don't set error for missing API endpoint
        } else {
          console.error('Error fetching messages:', apiErr);
          setError(apiErr instanceof Error ? apiErr.message : 
            (apiErr as any)?.response?.data?.message ?? 'Failed to load chat history');
        }
      }
    } finally {
      setLoading(false);
    }
  }, [leagueId]);

  // Handle new message from socket
  const handleNewMessage = useCallback((message: ChatMessage) => {
    console.log('Received new message via socket');
    setMessages((prev) => [...prev, message]);
    // Remove user from typing list when they send a message
    setTypingUsers((prev) => prev.filter((u) => u.userId !== message.userId));
  }, []);

  // Handle user typing notification
  const handleUserTyping = useCallback(({ userId, username }: UserEvent) => {
    // Skip if this is the current user typing
    if (userId === user?._id) return;

    console.log(`User typing: ${username}`);
    setTypingUsers((prev) => {
      // Only add if not already in the list
      if (!prev.some((u) => u.userId === userId)) {
        const newTypingUsers = [...prev, { userId, username }];
        // Auto-remove typing indicator after 3 seconds
        setTimeout(() => {
          setTypingUsers((current) => current.filter((u) => u.userId !== userId));
        }, 3000);
        return newTypingUsers;
      }
      return prev;
    });
  }, [user?._id]);

  // Handle user joined notification
  const handleUserJoined = useCallback(({ username }: UserEvent) => {
    console.log(`User joined: ${username}`);
    const systemMessage: ChatMessage = {
      _id: Date.now().toString(),
      content: `${username} joined the chat`,
      type: 'system',
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, systemMessage]);
  }, []);

  // Handle user left notification
  const handleUserLeft = useCallback(({ userId, username }: UserEvent) => {
    console.log(`User left: ${username}`);
    const systemMessage: ChatMessage = {
      _id: Date.now().toString(),
      content: `${username} left the chat`,
      type: 'system',
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, systemMessage]);
    // Remove user from typing list when they leave
    setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
  }, []);

  // Socket setup
  useEffect(() => {
    if (!leagueId) return;

    fetchMessages();

    if (socket && connected) {
      console.log(`Setting up chat socket for league: ${leagueId}`);
      joinLeague(leagueId);

      socket.on(EVENTS.CHAT_MESSAGE, handleNewMessage);
      socket.on(EVENTS.USER_TYPING, handleUserTyping);
      socket.on(EVENTS.USER_JOINED, handleUserJoined);
      socket.on(EVENTS.USER_LEFT, handleUserLeft);
      socket.on('error', (err: Error) => setError(`Socket error: ${err.message}`));

      return () => {
        console.log(`Cleaning up chat socket for league: ${leagueId}`);
        leaveLeague(leagueId);
        socket.off(EVENTS.CHAT_MESSAGE, handleNewMessage);
        socket.off(EVENTS.USER_TYPING, handleUserTyping);
        socket.off(EVENTS.USER_JOINED, handleUserJoined);
        socket.off(EVENTS.USER_LEFT, handleUserLeft);
        socket.off('error');
      };
    }
    
    return undefined;
  }, [
    socket, 
    connected, 
    leagueId, 
    fetchMessages, 
    handleNewMessage, 
    handleUserTyping, 
    handleUserJoined, 
    handleUserLeft, 
    EVENTS, 
    joinLeague, 
    leaveLeague
  ]);

  // Send a new message
  const sendMessage = useCallback(
    async (content: string, type: string = 'text') => {
      if (!content || !leagueId || !user) return;

      console.log(`Sending message in league: ${leagueId}`);
      const message: ChatMessage = {
        _id: Date.now().toString(), // Add a temporary client-side ID
        leagueId,
        content,
        type: type as 'text' | 'system' | 'image',
        sender: { 
          _id: user._id, 
          name: user.name ?? 'Unknown'
        },
        createdAt: new Date().toISOString(),
      };

      try {
        socketSendMessage(message);
      } catch (err) {
        console.error('Error sending message:', err);
        setError('Failed to send message');
      }
    },
    [leagueId, socketSendMessage, user]
  );

  // Send typing indicator
  const sendTypingIndicator = useCallback(() => {
    if (leagueId && connected) {
      sendTyping(leagueId);
    }
  }, [leagueId, sendTyping, connected]);

  return {
    messages,
    loading,
    error,
    typingUsers,
    sendMessage,
    sendTypingIndicator,
    refreshMessages: fetchMessages,
  };
}

export default useChat;