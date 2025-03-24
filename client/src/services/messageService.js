// client/src/services/messageService.js

import { collection, query, where, orderBy, limit, getDocs, addDoc, updateDoc, increment, doc, getDoc, arrayUnion, arrayRemove, serverTimestamp, startAfter, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import api from './api';

const MessageService = {
  // Get messages for a league - Firestore implementation
  getLeagueMessages: async (leagueId, limitCount = 50, before = null) => {
    try {
      let messagesQuery;
      
      if (before) {
        const beforeDate = new Date(before);
        
        messagesQuery = query(
          collection(db, 'messages'),
          where('league', '==', leagueId),
          where('createdAt', '<', beforeDate),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );
      } else {
        messagesQuery = query(
          collection(db, 'messages'),
          where('league', '==', leagueId),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );
      }
      
      const messagesSnapshot = await getDocs(messagesQuery);
      
      const messages = [];
      messagesSnapshot.forEach(doc => {
        messages.push({
          _id: doc.id,
          ...doc.data()
        });
      });
      
      // Populate sender information
      const populatedMessages = await Promise.all(messages.map(async (message) => {
        const senderDoc = await getDoc(doc(db, 'users', message.sender));
        
        return {
          ...message,
          sender: senderDoc.exists() ? {
            _id: senderDoc.id,
            name: senderDoc.data().name,
            email: senderDoc.data().email,
            avatar: senderDoc.data().avatar || ''
          } : { _id: message.sender }
        };
      }));
      
      // Update readBy for each message
      const currentUserId = localStorage.getItem('userId');
      if (currentUserId) {
        populatedMessages.forEach(async (message) => {
          if (!message.readBy.includes(currentUserId)) {
            const messageRef = doc(db, 'messages', message._id);
            await updateDoc(messageRef, {
              readBy: arrayUnion(currentUserId)
            });
          }
        });
      }
      
      return populatedMessages;
    } catch (error) {
      console.error('Error getting messages from Firestore:', error);
      
      // Fallback to API
      try {
        let params = { limit: limitCount };
        if (before) {
          params.before = before;
        }
        
        const response = await api.get(`/messages/${leagueId}`, { params });
        return response.data;
      } catch (apiError) {
        console.error('API fallback error:', apiError);
        throw apiError;
      }
    }
  },
  
  // Send a message - Firestore implementation
  sendMessage: async (leagueId, content, type = 'text') => {
    try {
      const currentUserId = localStorage.getItem('userId');
      
      if (!currentUserId) {
        throw new Error('User not authenticated');
      }
      
      // Create message document
      const message = {
        league: leagueId,
        sender: currentUserId,
        content,
        type,
        reactions: {
          likes: [],
          hearts: []
        },
        readBy: [currentUserId],
        createdAt: new Date().toISOString()
      };
      
      const messageRef = await addDoc(collection(db, 'messages'), message);
      
      // Get sender information
      const senderDoc = await getDoc(doc(db, 'users', currentUserId));
      
      const completeMessage = {
        _id: messageRef.id,
        ...message,
        sender: senderDoc.exists() ? {
          _id: senderDoc.id,
          name: senderDoc.data().name,
          email: senderDoc.data().email,
          avatar: senderDoc.data().avatar || ''
        } : { _id: currentUserId }
      };
      
      return completeMessage;
    } catch (error) {
      console.error('Error sending message to Firestore:', error);
      
      // Fallback to API
      try {
        const response = await api.post('/messages', { leagueId, content, type });
        return response.data;
      } catch (apiError) {
        console.error('API fallback error:', apiError);
        throw apiError;
      }
    }
  },
  
  // Add reaction to a message - Firestore implementation
  addReaction: async (messageId, reaction) => {
    try {
      if (!['likes', 'hearts'].includes(reaction)) {
        throw new Error('Invalid reaction type');
      }
      
      const currentUserId = localStorage.getItem('userId');
      
      if (!currentUserId) {
        throw new Error('User not authenticated');
      }
      
      const messageRef = doc(db, 'messages', messageId);
      const messageDoc = await getDoc(messageRef);
      
      if (!messageDoc.exists()) {
        throw new Error('Message not found');
      }
      
      const message = messageDoc.data();
      
      // Check if user has already reacted
      const hasReacted = message.reactions[reaction].includes(currentUserId);
      
      if (hasReacted) {
        // Remove reaction
        await updateDoc(messageRef, {
          [`reactions.${reaction}`]: arrayRemove(currentUserId)
        });
      } else {
        // Add reaction
        await updateDoc(messageRef, {
          [`reactions.${reaction}`]: arrayUnion(currentUserId)
        });
      }
      
      // Get updated message
      const updatedDoc = await getDoc(messageRef);
      
      return { 
        message: 'Reaction updated', 
        reactions: updatedDoc.data().reactions 
      };
    } catch (error) {
      console.error('Error updating reaction in Firestore:', error);
      
      // Fallback to API
      try {
        const response = await api.post(`/messages/${messageId}/reaction`, { reaction });
        return response.data;
      } catch (apiError) {
        console.error('API fallback error:', apiError);
        throw apiError;
      }
    }
  },
  
  // Get unread message count - Firestore implementation
  getUnreadCount: async (leagueId) => {
    try {
      const currentUserId = localStorage.getItem('userId');
      
      if (!currentUserId) {
        throw new Error('User not authenticated');
      }
      
      // Get all messages in league not sent by current user
      const totalQuery = query(
        collection(db, 'messages'),
        where('league', '==', leagueId),
        where('sender', '!=', currentUserId)
      );
      
      const totalSnapshot = await getDocs(totalQuery);
      
      // Count messages not read by current user
      let unreadCount = 0;
      
      totalSnapshot.forEach(doc => {
        const message = doc.data();
        if (!message.readBy.includes(currentUserId)) {
          unreadCount++;
        }
      });
      
      return { unreadCount };
    } catch (error) {
      console.error('Error getting unread count from Firestore:', error);
      
      // Fallback to API
      try {
        const response = await api.get(`/messages/unread/${leagueId}`);
        return response.data;
      } catch (apiError) {
        console.error('API fallback error:', apiError);
        throw apiError;
      }
    }
  }
};

export default MessageService;