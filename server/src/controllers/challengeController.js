import { db } from '../config/firebase.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Get all challenges
// @route   GET /api/challenges
// @access  Private
export const getChallenges = asyncHandler(async (req, res) => {
  try {
    const { season } = req.query;
    
    let challengesQuery = db.collection('challenges');
    
    if (season) {
      challengesQuery = challengesQuery.where('season', '==', parseInt(season));
    }
    
    const challengesSnapshot = await challengesQuery.orderBy('season').orderBy('week').get();
    
    const challenges = [];
    const chefPromises = [];
    
    challengesSnapshot.forEach(doc => {
      const challenge = { 
        _id: doc.id,
        ...doc.data()
      };
      challenges.push(challenge);
    });
    
    // Populate chef references
    for (const challenge of challenges) {
      if (challenge.winner) {
        const winnerDoc = await db.collection('chefs').doc(challenge.winner).get();
        if (winnerDoc.exists) {
          challenge.winner = { 
            _id: winnerDoc.id, 
            name: winnerDoc.data().name, 
            image: winnerDoc.data().image 
          };
        }
      }
      
      if (challenge.topChefs && challenge.topChefs.length > 0) {
        const topChefDocs = await Promise.all(
          challenge.topChefs.map(chefId => db.collection('chefs').doc(chefId).get())
        );
        
        challenge.topChefs = topChefDocs
          .filter(doc => doc.exists)
          .map(doc => ({ 
            _id: doc.id, 
            name: doc.data().name, 
            image: doc.data().image 
          }));
      }
      
      if (challenge.bottomChefs && challenge.bottomChefs.length > 0) {
        const bottomChefDocs = await Promise.all(
          challenge.bottomChefs.map(chefId => db.collection('chefs').doc(chefId).get())
        );
        
        challenge.bottomChefs = bottomChefDocs
          .filter(doc => doc.exists)
          .map(doc => ({ 
            _id: doc.id, 
            name: doc.data().name, 
            image: doc.data().image 
          }));
      }
      
      if (challenge.eliminatedChef) {
        const eliminatedChefDoc = await db.collection('chefs').doc(challenge.eliminatedChef).get();
        if (eliminatedChefDoc.exists) {
          challenge.eliminatedChef = { 
            _id: eliminatedChefDoc.id, 
            name: eliminatedChefDoc.data().name, 
            image: eliminatedChefDoc.data().image 
          };
        }
      }
    }
    
    res.json(challenges);
  } catch (error) {
    console.error('Error fetching challenges:', error);
    res.status(500).json({ message: 'Failed to fetch challenges' });
  }
});

// @desc    Get a challenge by ID
// @route   GET /api/challenges/:id
// @access  Private
export const getChallengeById = asyncHandler(async (req, res) => {
  try {
    const challengeDoc = await db.collection('challenges').doc(req.params.id).get();
    
    if (!challengeDoc.exists) {
      res.status(404);
      throw new Error('Challenge not found');
    }
    
    const challenge = {
      _id: challengeDoc.id,
      ...challengeDoc.data()
    };
    
    // Populate chef references
    if (challenge.winner) {
      const winnerDoc = await db.collection('chefs').doc(challenge.winner).get();
      if (winnerDoc.exists) {
        challenge.winner = { 
          _id: winnerDoc.id, 
          name: winnerDoc.data().name, 
          image: winnerDoc.data().image 
        };
      }
    }
    
    if (challenge.topChefs && challenge.topChefs.length > 0) {
      const topChefDocs = await Promise.all(
        challenge.topChefs.map(chefId => db.collection('chefs').doc(chefId).get())
      );
      
      challenge.topChefs = topChefDocs
        .filter(doc => doc.exists)
        .map(doc => ({ 
          _id: doc.id, 
          name: doc.data().name, 
          image: doc.data().image 
        }));
    }
    
    if (challenge.bottomChefs && challenge.bottomChefs.length > 0) {
      const bottomChefDocs = await Promise.all(
        challenge.bottomChefs.map(chefId => db.collection('chefs').doc(chefId).get())
      );
      
      challenge.bottomChefs = bottomChefDocs
        .filter(doc => doc.exists)
        .map(doc => ({ 
          _id: doc.id, 
          name: doc.data().name, 
          image: doc.data().image 
        }));
    }
    
    if (challenge.eliminatedChef) {
      const eliminatedChefDoc = await db.collection('chefs').doc(challenge.eliminatedChef).get();
      if (eliminatedChefDoc.exists) {
        challenge.eliminatedChef = { 
          _id: eliminatedChefDoc.id, 
          name: eliminatedChefDoc.data().name, 
          image: eliminatedChefDoc.data().image 
        };
      }
    }
    
    res.json(challenge);
  } catch (error) {
    console.error('Error fetching challenge:', error);
    res.status(error.status || 500);
    throw new Error(error.message || 'Failed to fetch challenge');
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
  
  try {
    const challengeData = {
      season: parseInt(season),
      week: parseInt(week),
      title,
      description,
      location,
      isQuickfire: isQuickfire || false,
      guest: guest || '',
      winner: null,
      topChefs: [],
      bottomChefs: [],
      eliminatedChef: null,
      airDate: new Date(airDate).toISOString(),
      status: 'upcoming',
      createdAt: new Date().toISOString()
    };
    
    const challengeRef = db.collection('challenges').doc();
    await challengeRef.set(challengeData);
    
    const challenge = {
      _id: challengeRef.id,
      ...challengeData
    };
    
    res.status(201).json(challenge);
  } catch (error) {
    console.error('Error creating challenge:', error);
    res.status(500);
    throw new Error('Failed to create challenge');
  }
});

// @desc    Update a challenge (admin only)
// @route   PUT /api/challenges/:id
// @access  Private/Admin
export const updateChallenge = asyncHandler(async (req, res) => {
  try {
    const challengeRef = db.collection('challenges').doc(req.params.id);
    const challengeDoc = await challengeRef.get();
    
    if (!challengeDoc.exists) {
      res.status(404);
      throw new Error('Challenge not found');
    }
    
    const updates = {};
    
    // Basic fields
    if (req.body.title !== undefined) updates.title = req.body.title;
    if (req.body.description !== undefined) updates.description = req.body.description;
    if (req.body.location !== undefined) updates.location = req.body.location;
    if (req.body.isQuickfire !== undefined) updates.isQuickfire = req.body.isQuickfire;
    if (req.body.guest !== undefined) updates.guest = req.body.guest;
    if (req.body.airDate !== undefined) updates.airDate = new Date(req.body.airDate).toISOString();
    if (req.body.status !== undefined) updates.status = req.body.status;
    
    // Chef references
    if (req.body.winner !== undefined) updates.winner = req.body.winner;
    if (req.body.topChefs !== undefined) updates.topChefs = req.body.topChefs;
    if (req.body.bottomChefs !== undefined) updates.bottomChefs = req.body.bottomChefs;
    if (req.body.eliminatedChef !== undefined) updates.eliminatedChef = req.body.eliminatedChef;
    
    // Update challenge
    await challengeRef.update(updates);
    
    // Get updated challenge
    const updatedChallengeDoc = await challengeRef.get();
    const updatedChallenge = {
      _id: updatedChallengeDoc.id,
      ...updatedChallengeDoc.data()
    };
    
    // Populate chef references (same as in getChallengeById)
    if (updatedChallenge.winner) {
      const winnerDoc = await db.collection('chefs').doc(updatedChallenge.winner).get();
      if (winnerDoc.exists) {
        updatedChallenge.winner = { 
          _id: winnerDoc.id, 
          name: winnerDoc.data().name, 
          image: winnerDoc.data().image 
        };
      }
    }
    
    if (updatedChallenge.topChefs && updatedChallenge.topChefs.length > 0) {
      const topChefDocs = await Promise.all(
        updatedChallenge.topChefs.map(chefId => db.collection('chefs').doc(chefId).get())
      );
      
      updatedChallenge.topChefs = topChefDocs
        .filter(doc => doc.exists)
        .map(doc => ({ 
          _id: doc.id, 
          name: doc.data().name, 
          image: doc.data().image 
        }));
    }
    
    if (updatedChallenge.bottomChefs && updatedChallenge.bottomChefs.length > 0) {
      const bottomChefDocs = await Promise.all(
        updatedChallenge.bottomChefs.map(chefId => db.collection('chefs').doc(chefId).get())
      );
      
      updatedChallenge.bottomChefs = bottomChefDocs
        .filter(doc => doc.exists)
        .map(doc => ({ 
          _id: doc.id, 
          name: doc.data().name, 
          image: doc.data().image 
        }));
    }
    
    if (updatedChallenge.eliminatedChef) {
      const eliminatedChefDoc = await db.collection('chefs').doc(updatedChallenge.eliminatedChef).get();
      if (eliminatedChefDoc.exists) {
        updatedChallenge.eliminatedChef = { 
          _id: eliminatedChefDoc.id, 
          name: eliminatedChefDoc.data().name, 
          image: eliminatedChefDoc.data().image 
        };
      }
    }
    
    res.json(updatedChallenge);
  } catch (error) {
    console.error('Error updating challenge:', error);
    res.status(error.status || 500);
    throw new Error(error.message || 'Failed to update challenge');
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
  
  try {
    // Find the most recent challenge by airDate
    const latestChallengeQuery = db.collection('challenges')
      .where('season', '==', parseInt(season))
      .orderBy('airDate', 'desc')
      .limit(1);
    
    const latestChallengeSnapshot = await latestChallengeQuery.get();
    
    if (latestChallengeSnapshot.empty) {
      res.status(404);
      throw new Error('No challenges found for this season');
    }
    
    const latestChallenge = {
      _id: latestChallengeSnapshot.docs[0].id,
      ...latestChallengeSnapshot.docs[0].data()
    };
    
    // Get all challenges from the same week
    const currentChallengesQuery = db.collection('challenges')
      .where('season', '==', parseInt(season))
      .where('week', '==', latestChallenge.week);
    
    const currentChallengesSnapshot = await currentChallengesQuery.get();
    
    const currentChallenges = [];
    currentChallengesSnapshot.forEach(doc => {
      currentChallenges.push({
        _id: doc.id,
        ...doc.data()
      });
    });
    
    // Sort challenges by quickfire first, then airDate
    currentChallenges.sort((a, b) => {
      if (a.isQuickfire !== b.isQuickfire) {
        return a.isQuickfire ? -1 : 1;
      }
      return new Date(a.airDate) - new Date(b.airDate);
    });
    
    // Populate chef references (same as in getChallenges)
    for (const challenge of currentChallenges) {
      if (challenge.winner) {
        const winnerDoc = await db.collection('chefs').doc(challenge.winner).get();
        if (winnerDoc.exists) {
          challenge.winner = { 
            _id: winnerDoc.id, 
            name: winnerDoc.data().name, 
            image: winnerDoc.data().image 
          };
        }
      }
      
      if (challenge.topChefs && challenge.topChefs.length > 0) {
        const topChefDocs = await Promise.all(
          challenge.topChefs.map(chefId => db.collection('chefs').doc(chefId).get())
        );
        
        challenge.topChefs = topChefDocs
          .filter(doc => doc.exists)
          .map(doc => ({ 
            _id: doc.id, 
            name: doc.data().name, 
            image: doc.data().image 
          }));
      }
      
      if (challenge.bottomChefs && challenge.bottomChefs.length > 0) {
        const bottomChefDocs = await Promise.all(
          challenge.bottomChefs.map(chefId => db.collection('chefs').doc(chefId).get())
        );
        
        challenge.bottomChefs = bottomChefDocs
          .filter(doc => doc.exists)
          .map(doc => ({ 
            _id: doc.id, 
            name: doc.data().name, 
            image: doc.data().image 
          }));
      }
      
      if (challenge.eliminatedChef) {
        const eliminatedChefDoc = await db.collection('chefs').doc(challenge.eliminatedChef).get();
        if (eliminatedChefDoc.exists) {
          challenge.eliminatedChef = { 
            _id: eliminatedChefDoc.id, 
            name: eliminatedChefDoc.data().name, 
            image: eliminatedChefDoc.data().image 
          };
        }
      }
    }
    
    res.json(currentChallenges);
  } catch (error) {
    console.error('Error fetching current challenges:', error);
    res.status(error.status || 500);
    throw new Error(error.message || 'Failed to fetch current challenges');
  }
});