import { db } from '../config/firebase.js';
import asyncHandler from '../utils/asyncHandler.js';
import crypto from 'crypto';

export const createLeague = asyncHandler(async (req, res) => {
  const { name, season, maxMembers, maxRosterSize, scoringSettings } = req.body;

  if (!name || !season) {
    res.status(400);
    throw new Error('Name and season are required');
  }

  try {
    const inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase();
    
    // Create league document
    const leagueRef = db.collection('leagues').doc();
    const userId = req.user._id;
    
    const leagueData = {
      name,
      creator: userId,
      season,
      maxMembers: maxMembers || 10,
      maxRosterSize: maxRosterSize || 5,
      inviteCode,
      scoringSettings: scoringSettings || {
        quickfireWin: 10,
        challengeWin: 20,
        topThree: 5,
        bottomThree: -5,
        elimination: -15,
        finalWinner: 50
      },
      members: [{
        user: userId,
        role: 'owner',
        score: 0,
        joinedAt: new Date().toISOString()
      }],
      status: 'draft',
      currentWeek: 1,
      createdAt: new Date().toISOString()
    };
    
    await leagueRef.set(leagueData);
    
    // Add league to user's leagues
    const userRef = db.collection('users').doc(userId);
    await userRef.update({
      leagues: firebase.firestore.FieldValue.arrayUnion(leagueRef.id)
    });
    
    // Return league with ID
    const league = {
      _id: leagueRef.id,
      ...leagueData
    };
    
    res.status(201).json(league);
    
    // Emit real-time update if socket function exists
    if (typeof req.app.get('emitLeagueUpdate') === 'function') {
      req.app.get('emitLeagueUpdate')(leagueRef.id, { members: league.members });
    }
  } catch (error) {
    console.error('Create league error:', error);
    res.status(500);
    throw new Error('Failed to create league');
  }
});

export const getUserLeagues = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Query leagues where user is a member
    const leaguesSnapshot = await db.collection('leagues')
      .where('members', 'array-contains', { user: userId })
      .get();
    
    if (leaguesSnapshot.empty) {
      return res.json([]);
    }
    
    const leagues = [];
    leaguesSnapshot.forEach(doc => {
      leagues.push({
        _id: doc.id,
        ...doc.data()
      });
    });
    
    // Populate creator and member details
    const populatedLeagues = await Promise.all(leagues.map(async (league) => {
      // Get creator details
      const creatorDoc = await db.collection('users').doc(league.creator).get();
      const creator = creatorDoc.exists ? { _id: creatorDoc.id, ...creatorDoc.data() } : null;
      
      // Get member details
      const memberPromises = league.members.map(async (member) => {
        const userDoc = await db.collection('users').doc(member.user).get();
        return {
          ...member,
          user: userDoc.exists ? { _id: userDoc.id, ...userDoc.data() } : null
        };
      });
      
      const populatedMembers = await Promise.all(memberPromises);
      
      return {
        ...league,
        creator: creator ? { name: creator.name, email: creator.email } : null,
        members: populatedMembers
      };
    }));
    
    res.json(populatedLeagues);
  } catch (error) {
    console.error('Get user leagues error:', error);
    res.status(500);
    throw new Error('Failed to fetch leagues');
  }
});

export const getLeagueById = asyncHandler(async (req, res) => {
  try {
    const leagueDoc = await db.collection('leagues').doc(req.params.id).get();
    
    if (!leagueDoc.exists) {
      res.status(404);
      throw new Error('League not found');
    }
    
    const league = {
      _id: leagueDoc.id,
      ...leagueDoc.data()
    };
    
    // Check if user is a member
    const isMember = league.members.some(m => m.user === req.user._id);
    if (!isMember) {
      res.status(403);
      throw new Error('Not authorized to access this league');
    }
    
    // Populate creator and members
    const creatorDoc = await db.collection('users').doc(league.creator).get();
    league.creator = creatorDoc.exists ? 
      { _id: creatorDoc.id, name: creatorDoc.data().name, email: creatorDoc.data().email } : null;
    
    // Populate member info
    const memberPromises = league.members.map(async (member) => {
      const userDoc = await db.collection('users').doc(member.user).get();
      return {
        ...member,
        user: userDoc.exists ? 
          { _id: userDoc.id, name: userDoc.data().name, email: userDoc.data().email } : null
      };
    });
    
    league.members = await Promise.all(memberPromises);
    
    // Populate roster chefs
    for (const member of league.members) {
      if (member.roster && member.roster.length > 0) {
        const chefPromises = member.roster.map(async (rosterItem) => {
          const chefDoc = await db.collection('chefs').doc(rosterItem.chef).get();
          return {
            ...rosterItem,
            chef: chefDoc.exists ? { _id: chefDoc.id, ...chefDoc.data() } : null
          };
        });
        
        member.roster = await Promise.all(chefPromises);
      }
    }
    
    res.json(league);
  } catch (error) {
    console.error('Get league by id error:', error);
    res.status(error.status || 500);
    throw new Error(error.message || 'Failed to fetch league');
  }
});

export const updateLeague = asyncHandler(async (req, res) => {
  try {
    const leagueRef = db.collection('leagues').doc(req.params.id);
    const leagueDoc = await leagueRef.get();
    
    if (!leagueDoc.exists) {
      res.status(404);
      throw new Error('League not found');
    }
    
    const league = {
      _id: leagueDoc.id,
      ...leagueDoc.data()
    };
    
    // Check if user is admin
    const member = league.members.find(m => m.user === req.user._id);
    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      res.status(403);
      throw new Error('Not authorized to update this league');
    }
    
    // Update fields
    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.maxMembers) updates.maxMembers = req.body.maxMembers;
    if (req.body.maxRosterSize) updates.maxRosterSize = req.body.maxRosterSize;
    if (req.body.scoringSettings) updates.scoringSettings = req.body.scoringSettings;
    if (req.body.status) updates.status = req.body.status;
    if (req.body.currentWeek) updates.currentWeek = req.body.currentWeek;
    
    await leagueRef.update(updates);
    
    // Get updated league
    const updatedLeagueDoc = await leagueRef.get();
    const updatedLeague = {
      _id: updatedLeagueDoc.id,
      ...updatedLeagueDoc.data()
    };
    
    res.json(updatedLeague);
    
    // Emit real-time update
    if (typeof req.app.get('emitLeagueUpdate') === 'function') {
      req.app.get('emitLeagueUpdate')(req.params.id, updates);
    }
  } catch (error) {
    console.error('Update league error:', error);
    res.status(error.status || 500);
    throw new Error(error.message || 'Failed to update league');
  }
});

export const joinLeague = asyncHandler(async (req, res) => {
  const { inviteCode } = req.body;
  
  if (!inviteCode) {
    res.status(400);
    throw new Error('Invite code is required');
  }
  
  try {
    // Find league by invite code
    const leaguesSnapshot = await db.collection('leagues')
      .where('inviteCode', '==', inviteCode)
      .limit(1)
      .get();
    
    if (leaguesSnapshot.empty) {
      res.status(404);
      throw new Error('League not found with that invite code');
    }
    
    const leagueDoc = leaguesSnapshot.docs[0];
    const league = {
      _id: leagueDoc.id,
      ...leagueDoc.data()
    };
    
    // Check if league is full
    if (league.members.length >= league.maxMembers) {
      res.status(400);
      throw new Error('League is full');
    }
    
    // Check if user is already a member
    const userId = req.user._id;
    const isMember = league.members.some(m => m.user === userId);
    
    if (isMember) {
      res.status(400);
      throw new Error('You are already a member of this league');
    }
    
    // Add user to league
    const newMember = {
      user: userId,
      role: 'member',
      score: 0,
      joinedAt: new Date().toISOString()
    };
    
    await leagueDoc.ref.update({
      members: firebase.firestore.FieldValue.arrayUnion(newMember)
    });
    
    // Add league to user's leagues
    await db.collection('users').doc(userId).update({
      leagues: firebase.firestore.FieldValue.arrayUnion(leagueDoc.id)
    });
    
    // Get updated league
    const updatedLeagueDoc = await leagueDoc.ref.get();
    const updatedLeague = {
      _id: updatedLeagueDoc.id,
      ...updatedLeagueDoc.data()
    };
    
    res.json(updatedLeague);
    
    // Emit real-time update
    if (typeof req.app.get('emitLeagueUpdate') === 'function') {
      req.app.get('emitLeagueUpdate')(leagueDoc.id, { 
        members: updatedLeague.members 
      });
    }
  } catch (error) {
    console.error('Join league error:', error);
    res.status(error.status || 500);
    throw new Error(error.message || 'Failed to join league');
  }
});

export const updateDraftOrder = asyncHandler(async (req, res) => {
  const { draftOrder } = req.body;
  
  try {
    const leagueRef = db.collection('leagues').doc(req.params.id);
    const leagueDoc = await leagueRef.get();
    
    if (!leagueDoc.exists) {
      res.status(404);
      throw new Error('League not found');
    }
    
    const league = leagueDoc.data();
    
    // Check if user is admin
    const member = league.members.find(m => m.user === req.user._id);
    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      res.status(403);
      throw new Error('Not authorized to update draft order');
    }
    
    // Update draft order
    await leagueRef.update({ draftOrder });
    
    // Get updated league
    const updatedLeagueDoc = await leagueRef.get();
    const updatedLeague = {
      _id: updatedLeagueDoc.id,
      ...updatedLeagueDoc.data()
    };
    
    res.json(updatedLeague);
    
    // Emit real-time update
    if (typeof req.app.get('emitLeagueUpdate') === 'function') {
      req.app.get('emitLeagueUpdate')(req.params.id, { draftOrder });
    }
  } catch (error) {
    console.error('Update draft order error:', error);
    res.status(error.status || 500);
    throw new Error(error.message || 'Failed to update draft order');
  }
});

export const draftChef = asyncHandler(async (req, res) => {
  const { chefId } = req.body;
  
  if (!chefId) {
    res.status(400);
    throw new Error('Chef ID is required');
  }
  
  try {
    const leagueRef = db.collection('leagues').doc(req.params.id);
    const leagueDoc = await leagueRef.get();
    
    if (!leagueDoc.exists) {
      res.status(404);
      throw new Error('League not found');
    }
    
    const league = {
      _id: leagueDoc.id,
      ...leagueDoc.data()
    };
    
    // Check if league is in draft mode
    if (league.status !== 'draft') {
      res.status(400);
      throw new Error('League is not in draft mode');
    }
    
    // Find member
    const userId = req.user._id;
    const memberIndex = league.members.findIndex(m => m.user === userId);
    
    if (memberIndex === -1) {
      res.status(403);
      throw new Error('You are not a member of this league');
    }
    
    const member = league.members[memberIndex];
    
    // Check if roster is full
    if (member.roster && member.roster.length >= league.maxRosterSize) {
      res.status(400);
      throw new Error('Your roster is full');
    }
    
    // Check if chef is already drafted
    const chefDrafted = league.members.some(m => 
      m.roster && m.roster.some(r => r.chef === chefId)
    );
    
    if (chefDrafted) {
      res.status(400);
      throw new Error('This chef has already been drafted');
    }
    
    // Add chef to roster
    const newRoster = [...(member.roster || []), {
      chef: chefId,
      drafted: new Date().toISOString(),
      active: true
    }];
    
    // Update the member's roster
    league.members[memberIndex].roster = newRoster;
    
    await leagueRef.update({
      members: league.members
    });
    
    // Get updated league
    const updatedLeagueDoc = await leagueRef.get();
    const updatedLeague = {
      _id: updatedLeagueDoc.id,
      ...updatedLeagueDoc.data()
    };
    
    res.json(updatedLeague);
    
    // Emit real-time update
    if (typeof req.app.get('emitLeagueUpdate') === 'function') {
      req.app.get('emitLeagueUpdate')(req.params.id, { 
        members: updatedLeague.members 
      });
    }
  } catch (error) {
    console.error('Draft chef error:', error);
    res.status(error.status || 500);
    throw new Error(error.message || 'Failed to draft chef');
  }
});

export const getLeagueLeaderboard = asyncHandler(async (req, res) => {
  try {
    const leagueRef = db.collection('leagues').doc(req.params.id);
    const leagueDoc = await leagueRef.get();
    
    if (!leagueDoc.exists) {
      res.status(404);
      throw new Error('League not found');
    }
    
    const league = {
      _id: leagueDoc.id,
      ...leagueDoc.data()
    };
    
    // Check if user is a member
    const isMember = league.members.some(m => m.user === req.user._id);
    if (!isMember) {
      res.status(403);
      throw new Error('Not authorized to access this league');
    }
    
    // Populate member info for leaderboard
    const memberPromises = league.members.map(async (member) => {
      const userDoc = await db.collection('users').doc(member.user).get();
      const userData = userDoc.exists ? userDoc.data() : null;
      
      return {
        user: {
          _id: member.user,
          name: userData?.name || 'Unknown',
          email: userData?.email || '',
          avatar: userData?.avatar || '',
        },
        score: member.score || 0,
        rosterCount: (member.roster?.length || 0)
      };
    });
    
    const leaderboard = await Promise.all(memberPromises);
    
    // Sort by score (highest first)
    leaderboard.sort((a, b) => b.score - a.score);
    
    res.json(leaderboard);
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(error.status || 500);
    throw new Error(error.message || 'Failed to fetch leaderboard');
  }
});