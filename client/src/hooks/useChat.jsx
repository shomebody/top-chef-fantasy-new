import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket.jsx';
import { useAuth } from './useAuth.jsx';
import api from '../services/api.js';

export const useChat = (leagueId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);

  const { socket, connected, EVENTS, joinLeague, leaveLeague, sendMessage: socketSendMessage, sendTyping } = useSocket();
  const { user } = useAuth();

  // Fetch chat history when leagueId changes
  const fetchMessages = useCallback(async () => {
    if (!leagueId) return;
    try {
      setLoading(true);
      const response = await api.get(`/messages/${leagueId}`);
      setMessages(response.data.reverse()); // Newest messages at the bottom
      setError(null);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err.response?.data?.message || 'Failed to load chat history');
    } finally {
      setLoading(false);
    }
  }, [leagueId]);

  // Handle new message from socket
  const handleNewMessage = useCallback((message) => {
    setMessages((prev) => [...prev, message]);
    setTypingUsers((prev) => prev.filter((u) => u.userId !== message.userId));
  }, []);

  // Handle user typing notification
  const handleUserTyping = useCallback(({ userId, username }) => {
    if (userId === user?._id) return;

    setTypingUsers((prev) => {
      if (!prev.some((u) => u.userId === userId)) {
        const newTypingUsers = [...prev, { userId, username }];
        setTimeout(() => {
          setTypingUsers((current) => current.filter((u) => u.userId !== userId));
        }, 3000);
        return newTypingUsers;
      }
      return prev;
    });
  }, [user]);

  // Handle user joined notification
  const handleUserJoined = useCallback(({ userId, username }) => {
    const systemMessage = {
      _id: Date.now().toString(),
      content: `${username} joined the chat`,
      type: 'system',
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, systemMessage]);
  }, []);

  // Handle user left notification
  const handleUserLeft = useCallback(({ userId, username }) => {
    const systemMessage = {
      _id: Date.now().toString(),
      content: `${username} left the chat`,
      type: 'system',
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, systemMessage]);
    setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
  }, []);

  // Socket setup
  useEffect(() => {
    if (!leagueId) return;

    fetchMessages();

    if (socket && connected) {
      joinLeague(leagueId);

      socket.on(EVENTS.CHAT_MESSAGE, handleNewMessage);
      socket.on(EVENTS.USER_TYPING, handleUserTyping);
      socket.on(EVENTS.USER_JOINED, handleUserJoined);
      socket.on(EVENTS.USER_LEFT, handleUserLeft);
      socket.on('error', (err) => setError(`Socket error: ${err.message}`));

      return () => {
        leaveLeague(leagueId);
        socket.off(EVENTS.CHAT_MESSAGE, handleNewMessage);
        socket.off(EVENTS.USER_TYPING, handleUserTyping);
        socket.off(EVENTS.USER_JOINED, handleUserJoined);
        socket.off(EVENTS.USER_LEFT, handleUserLeft);
        socket.off('error');
      };
    }
  }, [socket, connected, leagueId, fetchMessages, handleNewMessage, handleUserTyping, handleUserJoined, handleUserLeft]);

  // Send a new message
  const sendMessage = useCallback(
    async (content, type = 'text') => {
      if (!content || !leagueId || !user) return;

      const message = {
        leagueId,
        content,
        type,
        sender: { _id: user._id, name: user.name },
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
};