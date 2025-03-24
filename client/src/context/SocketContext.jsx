import React, { createContext, useState, useEffect, useMemo } from 'react';
import { collection, doc, onSnapshot, setDoc, updateDoc, arrayUnion, Timestamp, query, where, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../hooks/useAuth.jsx';

// Create context with default values
export const ChatContext = createContext({
  messages: [],
  loading: false,
  error: null,
  sendMessage: () => {},
  joinLeague: () => {},
  leaveLeague: () => {},
  typingUsers: [],
  sendTypingIndicator: () => {}
});

export function ChatProvider({ children }) {
  const [messages, setMessages] = useState([]);
  const [currentLeagueId, setCurrentLeagueId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [messageListeners, setMessageListeners] = useState({});
  const [typingListeners, setTypingListeners] = useState({});
  
  const { user, isAuthenticated } = useAuth();

  // Join a league chat
  const joinLeague = (leagueId) => {
    if (leagueId && isAuthenticated) {
      setCurrentLeagueId(leagueId);
      fetchMessages(leagueId);
      listenForTyping(leagueId);
    }
  };

  // Leave a league chat
  const leaveLeague = (leagueId) => {
    if (leagueId && messageListeners[leagueId]) {
      messageListeners[leagueId]();
      typingListeners[leagueId]?.();
      
      setMessageListeners(prev => {
        const updated = {...prev};
        delete updated[leagueId];
        return updated;
      });
      
      setTypingListeners(prev => {
        const updated = {...prev};
        delete updated[leagueId];
        return updated;
      });
      
      setCurrentLeagueId(null);
      setMessages([]);
      setTypingUsers([]);
    }
  };

  // Fetch messages for a league
  const fetchMessages = (leagueId) => {
    setLoading(true);
    
    // Create a query for messages
    const messagesQuery = query(
      collection(db, 'messages'),
      where('league', '==', leagueId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    
    // Listen for real-time updates
    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const messageList = snapshot.docs.map(doc => ({
          _id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString()
        })).reverse(); // To match the previous behavior
        
        setMessages(messageList);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching messages:', err);
        setError('Failed to load chat history');
        setLoading(false);
      }
    );
    
    // Store the unsubscribe function
    setMessageListeners(prev => ({
      ...prev,
      [leagueId]: unsubscribe
    }));
  };

  // Listen for typing indicators
  const listenForTyping = (leagueId) => {
    const typingRef = collection(db, 'typing');
    const typingQuery = query(
      typingRef,
      where('leagueId', '==', leagueId)
    );
    
    const unsubscribe = onSnapshot(
      typingQuery,
      (snapshot) => {
        const now = new Date();
        const activeTypers = snapshot.docs
          .map(doc => doc.data())
          .filter(data => {
            // Only show typing indicators for the last 3 seconds
            const timestamp = data.timestamp?.toDate() || new Date(0);
            const timeDiff = (now - timestamp) / 1000;
            return timeDiff <= 3 && data.userId !== user?._id;
          })
          .map(data => ({
            userId: data.userId,
            username: data.username
          }));
        
        setTypingUsers(activeTypers);
      },
      (err) => {
        console.error('Error listening for typing:', err);
      }
    );
    
    setTypingListeners(prev => ({
      ...prev,
      [leagueId]: unsubscribe
    }));
  };

  // Send a message
  const sendMessage = async (content, type = 'text') => {
    if (!content || !currentLeagueId || !user) return;
    
    try {
      const newMessage = {
        league: currentLeagueId,
        sender: user._id,
        senderName: user.name,
        content,
        type,
        reactions: {
          likes: [],
          hearts: []
        },
        readBy: [user._id],
        createdAt: Timestamp.now()
      };
      
      // Add message to Firestore
      await setDoc(doc(collection(db, 'messages')), newMessage);
      
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    }
  };

  // Send typing indicator
  const sendTypingIndicator = async () => {
    if (!currentLeagueId || !user) return;
    
    try {
      const typingId = `${currentLeagueId}_${user._id}`;
      const typingRef = doc(db, 'typing', typingId);
      
      await setDoc(typingRef, {
        leagueId: currentLeagueId,
        userId: user._id,
        username: user.name,
        timestamp: Timestamp.now()
      });
      
    } catch (err) {
      console.error('Error sending typing indicator:', err);
    }
  };

  // Clean up listeners on unmount
  useEffect(() => {
    return () => {
      // Clean up all message listeners
      Object.values(messageListeners).forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
      
      // Clean up all typing listeners
      Object.values(typingListeners).forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
    };
  }, [messageListeners, typingListeners]);

  // Memoize context value
  const contextValue = useMemo(() => ({
    messages,
    loading,
    error,
    joinLeague,
    leaveLeague,
    sendMessage,
    typingUsers,
    sendTypingIndicator
  }), [messages, loading, error, typingUsers]);

  return (
    <ChatContext value={contextValue}>
      {children}
    </ChatContext>
  );
}