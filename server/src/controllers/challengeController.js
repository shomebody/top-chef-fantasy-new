import Challenge from '../models/challengeModel.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Get all challenges
// @route   GET /api/challenges
// @access  Private
export const getChallenges = asyncHandler(async (req, res) => {
  const { season } = req.query;
  
  const filter = season ? { season } : {};
  
  const challenges = await Challenge.find(filter)
    .populate('winner', 'name image')
    .populate('topChefs', 'name image')
    .populate('bottomChefs', 'name image')
    .populate('eliminatedChef', 'name image')
    .sort({ season: 1, week: 1 });
  
  res.json(challenges);
});

// @desc    Get a challenge by ID
// @route   GET /api/challenges/:id
// @access  Private
export const getChallengeById = asyncHandler(async (req, res) => {
  const challenge = await Challenge.findById(req.params.id)
    .populate('winner', 'name image')
    .populate('topChefs', 'name image')
    .populate('bottomChefs', 'name image')
    .populate('eliminatedChef', 'name image');
  
  if (challenge) {
    res.json(challenge);
  } else {
    res.status(404);
    throw new Error('Challenge not found');
  }
});

// @desc    Create a challenge (admin only)
// @route   POST /api/challenges
// @access  Private/Admin
export const createChallenge = asyncHandler(async (req, res) => {
  const {
    season,
    week,
    title,
    description,
    location,
    isQuickfire,
    guest,
    airDate
  } = req.body;
  
  const challenge = await Challenge.create({
    season,
    week,
    title,
    description,
    location,
    isQuickfire: isQuickfire || false,
    guest: guest || '',
    airDate
  });
  
  res.status(201).json(challenge);
});

// @desc    Update a challenge (admin only)
// @route   PUT /api/challenges/:id
// @access  Private/Admin
export const updateChallenge = asyncHandler(async (req, res) => {
  const challenge = await Challenge.findById(req.params.id);
  
  if (challenge) {
    challenge.title = req.body.title || challenge.title;
    challenge.description = req.body.description || challenge.description;
    challenge.location = req.body.location || challenge.location;
    challenge.isQuickfire = req.body.isQuickfire !== undefined ? req.body.isQuickfire : challenge.isQuickfire;
    challenge.guest = req.body.guest || challenge.guest;
    challenge.airDate = req.body.airDate || challenge.airDate;
    challenge.status = req.body.status || challenge.status;
    
    if (req.body.winner !== undefined) {
      challenge.winner = req.body.winner;
    }
    
    if (req.body.topChefs) {
      challenge.topChefs = req.body.topChefs;
    }
    
    if (req.body.bottomChefs) {
      challenge.bottomChefs = req.body.bottomChefs;
    }
    
    if (req.body.eliminatedChef !== undefined) {
      challenge.eliminatedChef = req.body.eliminatedChef;
    }
    
    const updatedChallenge = await challenge.save();
    res.json(updatedChallenge);
  } else {
    res.status(404);
    throw new Error('Challenge not found');
  }
});

// @desc    Get current week's challenges
// @route   GET /api/challenges/current
// @access  Private
export const getCurrentChallenges = asyncHandler(async (req, res) => {
  const { season } = req.query;
  
  if (!season) {
    res.status(400);
    throw new Error('Season parameter is required');
  }
  
  // Find the most recent challenge by airDate
  const latestChallenge = await Challenge.findOne({ season })
    .sort({ airDate: -1 });
  
  if (!latestChallenge) {
    res.status(404);
    throw new Error('No challenges found for this season');
  }
  
  // Get all challenges from the same week
  const currentChallenges = await Challenge.find({
    season,
    week: latestChallenge.week
  })
    .populate('winner', 'name image')
    .populate('topChefs', 'name image')
    .populate('bottomChefs', 'name image')
    .populate('eliminatedChef', 'name image')
    .sort({ isQuickfire: 1, airDate: 1 });
  
  res.json(currentChallenges);
});
