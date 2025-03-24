import { db } from '../config/firebase.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Get all chefs
// @route   GET /api/chefs
// @access  Private
export const getChefs = asyncHandler(async (req, res) => {
  try {
    const chefsSnapshot = await db.collection('chefs')
      .orderBy('stats.totalPoints', 'desc')
      .get();
    
    const chefs = chefsSnapshot.docs.map(doc => ({
      _id: doc.id,
      ...doc.data()
    }));
    
    res.json(chefs);
  } catch (error) {
    console.error('Error fetching chefs:', error);
    res.status(500).json({ message: 'Failed to fetch chefs' });
  }
});

// @desc    Get a chef by ID
// @route   GET /api/chefs/:id
// @access  Private
export const getChefById = asyncHandler(async (req, res) => {
  try {
    const chefDoc = await db.collection('chefs').doc(req.params.id).get();
    
    if (!chefDoc.exists) {
      res.status(404);
      throw new Error('Chef not found');
    }
    
    res.json({
      _id: chefDoc.id,
      ...chefDoc.data()
    });
  } catch (error) {
    console.error('Error fetching chef:', error);
    res.status(error.status || 500).json({ message: error.message || 'Failed to fetch chef' });
  }
});

// @desc    Create a chef (admin only)
// @route   POST /api/chefs
// @access  Private/Admin
export const createChef = asyncHandler(async (req, res) => {
  try {
    const { name, bio, hometown, specialty, image } = req.body;
    
    // Create chef object with default values
    const chef = {
      name,
      bio,
      hometown,
      specialty,
      image: image || '',
      status: 'active',
      eliminationWeek: null,
      stats: {
        wins: 0,
        eliminations: 0,
        quickfireWins: 0,
        challengeWins: 0,
        totalPoints: 0
      },
      weeklyPerformance: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Add to Firestore
    const docRef = await db.collection('chefs').add(chef);
    
    // Get the new document
    const newChef = await docRef.get();
    
    res.status(201).json({
      _id: newChef.id,
      ...newChef.data()
    });
  } catch (error) {
    console.error('Error creating chef:', error);
    res.status(500).json({ message: 'Failed to create chef' });
  }
});

// @desc    Update a chef (admin only)
// @route   PUT /api/chefs/:id
// @access  Private/Admin
export const updateChef = asyncHandler(async (req, res) => {
  try {
    const chefRef = db.collection('chefs').doc(req.params.id);
    const chefDoc = await chefRef.get();
    
    if (!chefDoc.exists) {
      res.status(404);
      throw new Error('Chef not found');
    }
    
    const updates = {};
    
    // Basic fields
    if (req.body.name) updates.name = req.body.name;
    if (req.body.bio) updates.bio = req.body.bio;
    if (req.body.hometown) updates.hometown = req.body.hometown;
    if (req.body.specialty) updates.specialty = req.body.specialty;
    if (req.body.image) updates.image = req.body.image;
    if (req.body.status) updates.status = req.body.status;
    
    // Stats
    if (req.body.stats) {
      const currentStats = chefDoc.data().stats || {};
      updates.stats = { ...currentStats, ...req.body.stats };
    }
    
    // Elimination week
    if (req.body.eliminationWeek !== undefined) {
      updates.eliminationWeek = req.body.eliminationWeek;
    }
    
    // Weekly performance
    if (req.body.weeklyPerformance) {
      updates.weeklyPerformance = admin.firestore.FieldValue.arrayUnion(req.body.weeklyPerformance);
    }
    
    // Update the document
    await chefRef.update(updates);
    
    // Get the updated document
    const updatedChef = await chefRef.get();
    
    res.json({
      _id: updatedChef.id,
      ...updatedChef.data()
    });
  } catch (error) {
    console.error('Error updating chef:', error);
    res.status(error.status || 500).json({ message: error.message || 'Failed to update chef' });
  }
});

// Other controller methods follow similar patterns