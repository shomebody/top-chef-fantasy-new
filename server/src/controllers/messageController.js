import Message from '../models/messageModel.js';
import League from '../models/leagueModel.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Get messages for a league
// @route   GET /api/messages/:leagueId
// @access  Private
export const getLeagueMessages = asyncHandler(async (req, res) => {
  const { leagueId } = req.params;
  const { limit = 50, before } = req.query;
  
  // Check if user is a member of the league
  const league = await League.findById(leagueId);
  
  if (!league) {
    res.status(404);
    throw new Error('League not found');
  }
  
  const isMember = league.members.some(member => 
    member.user.toString() === req.user._id.toString()
  );
  
  if (!isMember) {
    res.status(403);
    throw new Error('Not authorized to access this league');
  }
  
  // Build query
  let query = { league: leagueId };
  
  if (before) {
    query.createdAt = { $lt: new Date(before) };
  }
  
  // Get messages
  const messages = await Message.find(query)
    .populate('sender', 'name email avatar')
    .sort('-createdAt')
    .limit(parseInt(limit));
  
  // Mark messages as read
  await Message.updateMany(
    {
      league: leagueId,
      readBy: { $ne: req.user._id }
    },
    {
      $addToSet: { readBy: req.user._id }
    }
  );
  
  res.json(messages);
});

// @desc    Create a message
// @route   POST /api/messages
// @access  Private
export const createMessage = asyncHandler(async (req, res) => {
  const { leagueId, content, type = 'text' } = req.body;
  
  // Check if user is a member of the league
  const league = await League.findById(leagueId);
  
  if (!league) {
    res.status(404);
    throw new Error('League not found');
  }
  
  const isMember = league.members.some(member => 
    member.user.toString() === req.user._id.toString()
  );
  
  if (!isMember) {
    res.status(403);
    throw new Error('Not authorized to post in this league');
  }
  
  // Create message
  const message = await Message.create({
    league: leagueId,
    sender: req.user._id,
    content,
    type,
    readBy: [req.user._id]  // Sender has read the message by default
  });
  
  // Populate sender information
  await message.populate('sender', 'name email avatar');
  
  res.status(201).json(message);
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
  
  const message = await Message.findById(req.params.id);
  
  if (!message) {
    res.status(404);
    throw new Error('Message not found');
  }
  
  // Check if user has already reacted
  const hasReacted = message.reactions[reaction].some(userId => 
    userId.toString() === req.user._id.toString()
  );
  
  if (hasReacted) {
    // Remove reaction
    message.reactions[reaction] = message.reactions[reaction].filter(userId => 
      userId.toString() !== req.user._id.toString()
    );
  } else {
    // Add reaction
    message.reactions[reaction].push(req.user._id);
  }
  
  await message.save();
  
  res.json({ message: 'Reaction updated', reactions: message.reactions });
});

// @desc    Get unread message count
// @route   GET /api/messages/unread/:leagueId
// @access  Private
export const getUnreadCount = asyncHandler(async (req, res) => {
  const { leagueId } = req.params;
  
  // Check if user is a member of the league
  const league = await League.findById(leagueId);
  
  if (!league) {
    res.status(404);
    throw new Error('League not found');
  }
  
  const isMember = league.members.some(member => 
    member.user.toString() === req.user._id.toString()
  );
  
  if (!isMember) {
    res.status(403);
    throw new Error('Not authorized to access this league');
  }
  
  // Count unread messages
  const unreadCount = await Message.countDocuments({
    league: leagueId,
    sender: { $ne: req.user._id },
    readBy: { $ne: req.user._id }
  });
  
  res.json({ unreadCount });
});