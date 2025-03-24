import League from '../models/leagueModel.js';
import User from '../models/userModel.js';
import asyncHandler from '../utils/asyncHandler.js';
import crypto from 'crypto';

export const createLeague = asyncHandler(async (req, res) => {
  const { name, season, maxMembers, maxRosterSize, scoringSettings } = req.body;

  if (!name || !season) {
    res.status(400);
    throw new Error('Name and season are required');
  }

  const inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase();
  const league = await League.create({
    name,
    creator: req.user._id,
    season,
    maxMembers: maxMembers || 10,
    maxRosterSize: maxRosterSize || 5,
    inviteCode,
    scoringSettings: scoringSettings || {},
    members: [{ user: req.user._id, role: 'owner', score: 0 }],
  });

  await User.findByIdAndUpdate(req.user._id, { $push: { leagues: league._id } });
  res.status(201).json(league);

  // Emit real-time update
  req.app.get('emitLeagueUpdate')?.(league._id, { members: league.members });
});

export const getUserLeagues = asyncHandler(async (req, res) => {
  const leagues = await League.find({ 'members.user': req.user._id })
    .populate('creator', 'name email')
    .populate('members.user', 'name email');
  res.json(leagues);
});

export const getLeagueById = asyncHandler(async (req, res) => {
  const league = await League.findById(req.params.id)
    .populate('creator', 'name email')
    .populate('members.user', 'name email')
    .populate('members.roster.chef');

  if (!league) {
    res.status(404);
    throw new Error('League not found');
  }

  const isMember = league.members.some((m) => m.user._id.toString() === req.user._id.toString());
  if (!isMember) {
    res.status(403);
    throw new Error('Not authorized to access this league');
  }

  res.json(league);
});

export const updateLeague = asyncHandler(async (req, res) => {
  const league = await League.findById(req.params.id);
  if (!league) {
    res.status(404);
    throw new Error('League not found');
  }

  const member = league.members.find((m) => m.user.toString() === req.user._id.toString());
  if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
    res.status(403);
    throw new Error('Not authorized to update this league');
  }

  league.name = req.body.name || league.name;
  league.maxMembers = req.body.maxMembers || league.maxMembers;
  league.maxRosterSize = req.body.maxRosterSize || league.maxRosterSize;
  league.scoringSettings = req.body.scoringSettings || league.scoringSettings;
  league.status = req.body.status || league.status;
  league.currentWeek = req.body.currentWeek || league.currentWeek;

  const updatedLeague = await league.save();
  res.json(updatedLeague);

  req.app.get('emitLeagueUpdate')?.(league._id, {
    name: updatedLeague.name,
    maxMembers: updatedLeague.maxMembers,
    maxRosterSize: updatedLeague.maxRosterSize,
  });
});

export const joinLeague = asyncHandler(async (req, res) => {
  const { inviteCode } = req.body;
  if (!inviteCode) {
    res.status(400);
    throw new Error('Invite code is required');
  }

  const league = await League.findOne({ inviteCode });
  if (!league) {
    res.status(404);
    throw new Error('League not found with that invite code');
  }

  if (league.members.length >= league.maxMembers) {
    res.status(400);
    throw new Error('League is full');
  }

  const isMember = league.members.some((m) => m.user.toString() === req.user._id.toString());
  if (isMember) {
    res.status(400);
    throw new Error('You are already a member of this league');
  }

  league.members.push({ user: req.user._id, role: 'member', score: 0 });
  await league.save();
  await User.findByIdAndUpdate(req.user._id, { $push: { leagues: league._id } });
  res.json(league);

  req.app.get('emitLeagueUpdate')?.(league._id, { members: league.members });
});

export const updateDraftOrder = asyncHandler(async (req, res) => {
  const { draftOrder } = req.body;
  const league = await League.findById(req.params.id);

  if (!league) {
    res.status(404);
    throw new Error('League not found');
  }

  const member = league.members.find((m) => m.user.toString() === req.user._id.toString());
  if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
    res.status(403);
    throw new Error('Not authorized to update draft order');
  }

  league.draftOrder = draftOrder || league.draftOrder;
  const updatedLeague = await league.save();
  res.json(updatedLeague);

  req.app.get('emitLeagueUpdate')?.(league._id, { draftOrder: updatedLeague.draftOrder });
});

export const draftChef = asyncHandler(async (req, res) => {
  const { chefId } = req.body;
  const league = await League.findById(req.params.id);

  if (!league) {
    res.status(404);
    throw new Error('League not found');
  }

  if (!chefId) {
    res.status(400);
    throw new Error('Chef ID is required');
  }

  if (league.status !== 'draft') {
    res.status(400);
    throw new Error('League is not in draft mode');
  }

  const memberIndex = league.members.findIndex((m) => m.user.toString() === req.user._id.toString());
  if (memberIndex === -1) {
    res.status(403);
    throw new Error('You are not a member of this league');
  }

  if (league.members[memberIndex].roster.length >= league.maxRosterSize) {
    res.status(400);
    throw new Error('Your roster is full');
  }

  const chefDrafted = league.members.some((m) => m.roster.some((r) => r.chef.toString() === chefId));
  if (chefDrafted) {
    res.status(400);
    throw new Error('This chef has already been drafted');
  }

  league.members[memberIndex].roster.push({ chef: chefId, drafted: new Date(), active: true });
  const updatedLeague = await league.save();
  res.json(updatedLeague);

  req.app.get('emitLeagueUpdate')?.(league._id, { members: updatedLeague.members });
});

export const getLeagueLeaderboard = asyncHandler(async (req, res) => {
  const league = await League.findById(req.params.id)
    .populate('members.user', 'name email avatar')
    .populate('members.roster.chef');

  if (!league) {
    res.status(404);
    throw new Error('League not found');
  }

  const isMember = league.members.some((m) => m.user._id.toString() === req.user._id.toString());
  if (!isMember) {
    res.status(403);
    throw new Error('Not authorized to access this league');
  }

  const leaderboard = league.members
    .map((member) => ({
      user: {
        _id: member.user._id,
        name: member.user.name,
        email: member.user.email,
        avatar: member.user.avatar,
      },
      score: member.score || 0,
      rosterCount: member.roster.length,
    }))
    .sort((a, b) => b.score - a.score);

  res.json(leaderboard);
});