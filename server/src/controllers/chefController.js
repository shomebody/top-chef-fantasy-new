// server/src/controllers/chefController.js
import admin, { db } from '../config/firebase.js';
import { createLogger, format, transports } from 'winston';
import asyncHandler from '../utils/asyncHandler.js';

// Configure logging with Winston
const logger = createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' }),
  ],
});

// @desc    Get all chefs
// @route   GET /api/chefs
// @access  Private
export const getChefs = asyncHandler(async (req, res) => {
  try {
    const chefsSnapshot = await db.collection('chefs')
      .orderBy('stats.totalPoints', 'desc')
      .get();

    const chefs = chefsSnapshot.docs.map((doc) => ({
      _id: doc.id,
      ...doc.data(),
    }));

    res.json(chefs);
  } catch (error) {
    logger.error('Error fetching chefs:', { message: error.message, stack: error.stack });
    throw new Error('Failed to fetch chefs');
  }
});

// @desc    Get a chef by ID
// @route   GET /api/chefs/:id
// @access  Private
export const getChefById = asyncHandler(async (req, res) => {
  try {
    const chefDoc = await db.collection('chefs').doc(req.params.id).get();

    if (!chefDoc.exists) {
      throw new Error('Chef not found');
    }

    const chefData = chefDoc.data() ?? {};
    res.json({
      _id: chefDoc.id,
      name: chefData.name ?? '',
      bio: chefData.bio ?? '',
      hometown: chefData.hometown ?? '',
      specialty: chefData.specialty ?? '',
      image: chefData.image ?? '',
      status: chefData.status ?? 'active',
      eliminationWeek: chefData.eliminationWeek ?? null,
      stats: chefData.stats ?? { wins: 0, eliminations: 0, quickfireWins: 0, challengeWins: 0, totalPoints: 0 },
      weeklyPerformance: chefData.weeklyPerformance ?? [],
    });
  } catch (error) {
    logger.error('Error fetching chef:', { message: error.message, stack: error.stack });
    throw new Error(error.message || 'Failed to fetch chef');
  }
});

// @desc    Get chef stats by ID
// @route   GET /api/chefs/:id/stats
// @access  Private
export const getChefStats = asyncHandler(async (req, res) => {
  try {
    const chefDoc = await db.collection('chefs').doc(req.params.id).get();

    if (!chefDoc.exists) {
      throw new Error('Chef not found');
    }

    const chefData = chefDoc.data() ?? {};
    const stats = chefData.stats ?? { wins: 0, eliminations: 0, quickfireWins: 0, challengeWins: 0, totalPoints: 0 };

    res.json({
      _id: chefDoc.id,
      name: chefData.name ?? '',
      stats,
      weeklyPerformance: chefData.weeklyPerformance ?? [],
    });
  } catch (error) {
    logger.error('Error fetching chef stats:', { message: error.message, stack: error.stack });
    throw new Error(error.message || 'Failed to fetch chef stats');
  }
});

// @desc    Create a chef (admin only)
// @route   POST /api/chefs
// @access  Private/Admin
export const createChef = asyncHandler(async (req, res) => {
  const { name, bio, hometown, specialty, image } = req.body;

  if (!name || !hometown || !specialty) {
    throw new Error('Name, hometown, and specialty are required');
  }

  try {
    const chef = {
      name,
      bio: bio ?? '',
      hometown,
      specialty,
      image: image ?? '',
      status: 'active',
      eliminationWeek: null,
      stats: {
        wins: 0,
        eliminations: 0,
        quickfireWins: 0,
        challengeWins: 0,
        totalPoints: 0,
      },
      weeklyPerformance: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection('chefs').add(chef);
    const newChef = await docRef.get();
    const newChefData = newChef.data() ?? {};

    res.status(201).json({
      _id: newChef.id,
      name: newChefData.name ?? '',
      bio: newChefData.bio ?? '',
      hometown: newChefData.hometown ?? '',
      specialty: newChefData.specialty ?? '',
      image: newChefData.image ?? '',
      status: newChefData.status ?? 'active',
      eliminationWeek: newChefData.eliminationWeek ?? null,
      stats: newChefData.stats ?? { wins: 0, eliminations: 0, quickfireWins: 0, challengeWins: 0, totalPoints: 0 },
      weeklyPerformance: newChefData.weeklyPerformance ?? [],
    });
  } catch (error) {
    logger.error('Error creating chef:', { message: error.message, stack: error.stack });
    throw new Error('Failed to create chef');
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
      throw new Error('Chef not found');
    }

    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.bio) updates.bio = req.body.bio;
    if (req.body.hometown) updates.hometown = req.body.hometown;
    if (req.body.specialty) updates.specialty = req.body.specialty;
    if (req.body.image) updates.image = req.body.image;
    if (req.body.status) updates.status = req.body.status;
    if (req.body.eliminationWeek !== undefined) updates.eliminationWeek = req.body.eliminationWeek;

    if (req.body.stats) {
      const currentStats = chefDoc.data()?.stats ?? {};
      updates.stats = { ...currentStats, ...req.body.stats };
    }

    if (req.body.weeklyPerformance) {
      updates.weeklyPerformance = admin.firestore.FieldValue.arrayUnion(req.body.weeklyPerformance);
    }

    await chefRef.update(updates);
    const updatedChef = await chefRef.get();
    const updatedChefData = updatedChef.data() ?? {};

    res.json({
      _id: updatedChef.id,
      name: updatedChefData.name ?? '',
      bio: updatedChefData.bio ?? '',
      hometown: updatedChefData.hometown ?? '',
      specialty: updatedChefData.specialty ?? '',
      image: updatedChefData.image ?? '',
      status: updatedChefData.status ?? 'active',
      eliminationWeek: updatedChefData.eliminationWeek ?? null,
      stats: updatedChefData.stats ?? { wins: 0, eliminations: 0, quickfireWins: 0, challengeWins: 0, totalPoints: 0 },
      weeklyPerformance: updatedChefData.weeklyPerformance ?? [],
    });
  } catch (error) {
    logger.error('Error updating chef:', { message: error.message, stack: error.stack });
    throw new Error(error.message || 'Failed to update chef');
  }
});

// @desc    Update chef weekly performance (admin only)
// @route   PUT /api/chefs/:id/weekly-performance
// @access  Private/Admin
export const updateWeeklyPerformance = asyncHandler(async (req, res) => {
  const { week, points, performanceNotes } = req.body;

  if (!week || points === undefined) {
    throw new Error('Week and points are required');
  }

  try {
    const chefRef = db.collection('chefs').doc(req.params.id);
    const chefDoc = await chefRef.get();

    if (!chefDoc.exists) {
      throw new Error('Chef not found');
    }

    const chefData = chefDoc.data() ?? {};
    const currentStats = chefData.stats ?? { wins: 0, eliminations: 0, quickfireWins: 0, challengeWins: 0, totalPoints: 0 };
    const newPerformance = {
      week,
      points,
      notes: performanceNotes ?? '',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    };

    await chefRef.update({
      weeklyPerformance: admin.firestore.FieldValue.arrayUnion(newPerformance),
      'stats.totalPoints': currentStats.totalPoints + points,
    });

    const updatedChef = await chefRef.get();
    const updatedChefData = updatedChef.data() ?? {};

    res.json({
      _id: updatedChef.id,
      name: updatedChefData.name ?? '',
      bio: updatedChefData.bio ?? '',
      hometown: updatedChefData.hometown ?? '',
      specialty: updatedChefData.specialty ?? '',
      image: updatedChefData.image ?? '',
      status: updatedChefData.status ?? 'active',
      eliminationWeek: updatedChefData.eliminationWeek ?? null,
      stats: updatedChefData.stats ?? { wins: 0, eliminations: 0, quickfireWins: 0, challengeWins: 0, totalPoints: 0 },
      weeklyPerformance: updatedChefData.weeklyPerformance ?? [],
    });
  } catch (error) {
    logger.error('Error updating weekly performance:', { message: error.message, stack: error.stack });
    throw new Error(error.message || 'Failed to update weekly performance');
  }
});