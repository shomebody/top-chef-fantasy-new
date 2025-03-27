import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
  where
} from 'firebase/firestore';
import { db } from '../config/firebase';
import api from './api';

interface ChatMessage {
  _id: string;
  league: string;
  sender: string;
  content: string;
  type: string;
  reactions: {
    likes: string[];
    hearts: string[];
  };
  readBy: string[];
  createdAt: string | Date;
}

interface MessageSender {
  _id: string;
  name: string;
  email?: string;
  avatar?: string;
}

interface MessageResponse {
  _id: string;
  league: string;
  sender: MessageSender;
  content: string;
  type: string;
  reactions: {
    likes: string[];
    hearts: string[];
  };
  readBy: string[];
  createdAt: string | Date;
}

const MessageService = {
  // Get messages for a league - Firestore implementation
  getLeagueMessages: async (leagueId: string, limitCount = 50, before?: string | null): Promise<MessageResponse[]> => {
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
      
      const messages: ChatMessage[] = [];
      messagesSnapshot.forEach(doc => {
        messages.push({
          _id: doc.id,
          ...doc.data()
        } as ChatMessage);
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
          } : { _id: message.sender, name: 'Unknown' }
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
        const params: Record<string, any> = { limit: limitCount };
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
  sendMessage: async (leagueId: string, content: string, type = 'text'): Promise<MessageResponse> => {
    try {
      const currentUserId = localStorage.getItem('userId');
      
      if (!currentUserId) {
        throw new Error('User not authenticated');
      }
      
      // Create message document
      const message: Omit<ChatMessage, '_id'> = {
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
      
      const completeMessage: MessageResponse = {
        _id: messageRef.id,
        ...message,
        sender: senderDoc.exists() ? {
          _id: senderDoc.id,
          name: senderDoc.data().name,
          email: senderDoc.data().email,
          avatar: senderDoc.data().avatar || ''
        } : { _id: currentUserId, name: 'Unknown' }
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
  addReaction: async (messageId: string, reaction: 'likes' | 'hearts'): Promise<{ message: string; reactions: { likes: string[]; hearts: string[] } }> => {
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
      
      const message = messageDoc.data() as ChatMessage;
      
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
        reactions: (updatedDoc.data() as ChatMessage).reactions 
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
  getUnreadCount: async (leagueId: string): Promise<{ unreadCount: number }> => {
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
        const message = doc.data() as ChatMessage;
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