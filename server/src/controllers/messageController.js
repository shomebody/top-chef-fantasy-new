// server/src/controllers/messageController.js

import { db } from '../config/firebase.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Get messages for a league
// @route   GET /api/messages/:leagueId
// @access  Private
export const getLeagueMessages = asyncHandler(async (req, res) => {
  try {
    const { leagueId } = req.params;
    const { limit = 50, before } = req.query;
    
    // Check if user is a member of the league
    const leagueDoc = await db.collection('leagues').doc(leagueId).get();
    
    if (!leagueDoc.exists) {
      res.status(404);
      throw new Error('League not found');
    }
    
    const league = leagueDoc.data();
    
    // Check if user is a member of the league
    const isMember = league.members.some(member => 
      member.user === req.user._id
    );
    
    if (!isMember) {
      res.status(403);
      throw new Error('Not authorized to access this league');
    }
    
    // Build query
    let messagesQuery = db.collection('messages')
      .where('league', '==', leagueId)
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit));
    
    if (before) {
      const beforeDate = new Date(before);
      messagesQuery = messagesQuery.where('createdAt', '<', beforeDate);
    }
    
    const messagesSnapshot = await messagesQuery.get();
    
    // Transform message data
    const messages = [];
    const userPromises = [];
    
    messagesSnapshot.forEach(doc => {
      messages.push({
        _id: doc.id,
        ...doc.data()
      });
    });
    
    // Populate sender information
    for (const message of messages) {
      const senderDoc = await db.collection('users').doc(message.sender).get();
      if (senderDoc.exists) {
        message.sender = {
          _id: senderDoc.id,
          name: senderDoc.data().name,
          email: senderDoc.data().email,
          avatar: senderDoc.data().avatar || ''
        };
      }
    }
    
    // Mark messages as read
    const batch = db.batch();
    
    for (const message of messages) {
      if (!message.readBy.includes(req.user._id)) {
        const messageRef = db.collection('messages').doc(message._id);
        batch.update(messageRef, {
          readBy: [...message.readBy, req.user._id]
        });
      }
    }
    
    await batch.commit();
    
    res.json(messages);
  } catch (error) {
    console.error('Get league messages error:', error);
    res.status(error.status || 500);
    throw new Error(error.message || 'Failed to fetch messages');
  }
});

// @desc    Create a message
// @route   POST /api/messages
// @access  Private
export const createMessage = asyncHandler(async (req, res) => {
  const { leagueId, content, type = 'text' } = req.body;
  
  try {
    // Check if user is a member of the league
    const leagueDoc = await db.collection('leagues').doc(leagueId).get();
    
    if (!leagueDoc.exists) {
      res.status(404);
      throw new Error('League not found');
    }
    
    const league = leagueDoc.data();
    
    const isMember = league.members.some(member => 
      member.user === req.user._id
    );
    
    if (!isMember) {
      res.status(403);
      throw new Error('Not authorized to post in this league');
    }
    
    // Create message
    const message = {
      league: leagueId,
      sender: req.user._id,
      content,
      type,
      reactions: {
        likes: [],
        hearts: []
      },
      readBy: [req.user._id],  // Sender has read the message by default
      createdAt: new Date().toISOString()
    };
    
    const messageRef = await db.collection('messages').add(message);
    const messageDoc = await messageRef.get();
    
    // Get sender data for response
    const senderDoc = await db.collection('users').doc(req.user._id).get();
    
    const completeMessage = {
      _id: messageRef.id,
      ...messageDoc.data(),
      sender: {
        _id: senderDoc.id,
        name: senderDoc.data().name,
        email: senderDoc.data().email,
        avatar: senderDoc.data().avatar || ''
      }
    };
    
    res.status(201).json(completeMessage);
  } catch (error) {
    console.error('Create message error:', error);
    res.status(error.status || 500);
    throw new Error(error.message || 'Failed to create message');
  }
});

// @desc    Add reaction to a message
// @route   POST /api/messages/:id/reaction
// @access  Private
export const addReaction = asyncHandler(async (req, res) => {
  const { reaction } = req.body;
  
  if (!['likes', 'hearts'].includes(reaction)) {
    res.status(400);
    throw new Error('Invalid reaction type');
  }
  
  try {
    const messageRef = db.collection('messages').doc(req.params.id);
    const messageDoc = await messageRef.get();
    
    if (!messageDoc.exists) {
      res.status(404);
      throw new Error('Message not found');
    }
    
    const message = messageDoc.data();
    
    // Check if user has already reacted
    const hasReacted = message.reactions[reaction].includes(req.user._id);
    
    if (hasReacted) {
      // Remove reaction
      await messageRef.update({
        [`reactions.${reaction}`]: message.reactions[reaction].filter(
          userId => userId !== req.user._id
        )
      });
    } else {
      // Add reaction
      await messageRef.update({
        [`reactions.${reaction}`]: [...message.reactions[reaction], req.user._id]
      });
    }
    
    // Get updated message
    const updatedDoc = await messageRef.get();
    
    res.json({ 
      message: 'Reaction updated', 
      reactions: updatedDoc.data().reactions 
    });
  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(error.status || 500);
    throw new Error(error.message || 'Failed to update reaction');
  }
});

// @desc    Get unread message count
// @route   GET /api/messages/unread/:leagueId
// @access  Private
export const getUnreadCount = asyncHandler(async (req, res) => {
  const { leagueId } = req.params;
  
  try {
    // Check if user is a member of the league
    const leagueDoc = await db.collection('leagues').doc(leagueId).get();
    
    if (!leagueDoc.exists) {
      res.status(404);
      throw new Error('League not found');
    }
    
    const league = leagueDoc.data();
    
    const isMember = league.members.some(member => 
      member.user === req.user._id
    );
    
    if (!isMember) {
      res.status(403);
      throw new Error('Not authorized to access this league');
    }
    
    // Count unread messages
    const unreadQuery = db.collection('messages')
      .where('league', '==', leagueId)
      .where('sender', '!=', req.user._id)
      .where('readBy', 'array-contains-any', [req.user._id]);
    
    const unreadSnapshot = await unreadQuery.get();
    const totalQuery = db.collection('messages')
      .where('league', '==', leagueId)
      .where('sender', '!=', req.user._id);
    
    const totalSnapshot = await totalQuery.get();
    
    const unreadCount = totalSnapshot.size - unreadSnapshot.size;
    
    res.json({ unreadCount });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(error.status || 500);
    throw new Error(error.message || 'Failed to get unread count');
  }
});