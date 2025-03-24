import Chef from '../models/chefModel.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Get all chefs
// @route   GET /api/chefs
// @access  Private
export const getChefs = asyncHandler(async (req, res) => {
  const chefs = await Chef.find({}).sort({ 'stats.totalPoints': -1 });
  res.json(chefs);
});

// @desc    Get a chef by ID
// @route   GET /api/chefs/:id
// @access  Private
export const getChefById = asyncHandler(async (req, res) => {
  const chef = await Chef.findById(req.params.id);
  
  if (chef) {
    res.json(chef);
  } else {
    res.status(404);
    throw new Error('Chef not found');
  }
});

// @desc    Create a chef (admin only)
// @route   POST /api/chefs
// @access  Private/Admin
export const createChef = asyncHandler(async (req, res) => {
  const { name, bio, hometown, specialty, image } = req.body;
  
  const chef = await Chef.create({
    name,
    bio,
    hometown,
    specialty,
    image: image || ''
  });
  
  res.status(201).json(chef);
});

// @desc    Update a chef (admin only)
// @route   PUT /api/chefs/:id
// @access  Private/Admin
export const updateChef = asyncHandler(async (req, res) => {
  const chef = await Chef.findById(req.params.id);
  
  if (chef) {
    chef.name = req.body.name || chef.name;
    chef.bio = req.body.bio || chef.bio;
    chef.hometown = req.body.hometown || chef.hometown;
    chef.specialty = req.body.specialty || chef.specialty;
    chef.image = req.body.image || chef.image;
    chef.status = req.body.status || chef.status;
    
    if (req.body.stats) {
      chef.stats = {
        ...chef.stats,
        ...req.body.stats
      };
    }
    
    if (req.body.eliminationWeek !== undefined) {
      chef.eliminationWeek = req.body.eliminationWeek;
    }
    
    if (req.body.weeklyPerformance) {
      chef.weeklyPerformance.push(req.body.weeklyPerformance);
    }
    
    const updatedChef = await chef.save();
    res.json(updatedChef);
  } else {
    res.status(404);
    throw new Error('Chef not found');
  }
});

// @desc    Get chef stats
// @route   GET /api/chefs/:id/stats
// @access  Private
export const getChefStats = asyncHandler(async (req, res) => {
  const chef = await Chef.findById(req.params.id);
  
  if (chef) {
    res.json({
      stats: chef.stats,
      weeklyPerformance: chef.weeklyPerformance,
      status: chef.status,
      eliminationWeek: chef.eliminationWeek
    });
  } else {
    res.status(404);
    throw new Error('Chef not found');
  }
});

// @desc    Update weekly performance for all chefs (admin only)
// @route   POST /api/chefs/weekly-update
// @access  Private/Admin
export const updateWeeklyPerformance = asyncHandler(async (req, res) => {
  const { week, performances } = req.body;
  
  // performances is an array of { chefId, highlights }
  const results = [];

  for (const performance of performances) {
    const chef = await Chef.findById(performance.chefId);
    
    if (chef) {
      // Initialize weekly performance entry
      const weeklyEntry = {
        week,
        points: 0,
        highlights: performance.highlights || []
      };

      // Calculate points based on highlights
      if (performance.highlights.includes('quickfire win')) {
        chef.stats.quickfireWins += 1;
        weeklyEntry.points += 5;
      }
      if (performance.highlights.includes('quickfire favorite')) {
        weeklyEntry.points += 1;
      }
      if (performance.highlights.includes('quickfire least')) {
        weeklyEntry.points -= 1;
      }
      if (performance.highlights.includes('challenge win')) {
        chef.stats.challengeWins += 1;
        weeklyEntry.points += 7;
        // Check for episode sweep bonus
        if (performance.highlights.includes('quickfire win')) {
          weeklyEntry.points += 3; // Sweep bonus
        }
      } else if (performance.highlights.includes('top')) {
        // Only add +3 if not a challenge win in the same episode
        weeklyEntry.points += 3;
      }
      if (performance.highlights.includes('bottom')) {
        weeklyEntry.points -= 2;
      }
      if (performance.highlights.includes('lck win')) {
        chef.stats.lckWins += 1; // Assumes lckWins is added to schema
        weeklyEntry.points += 2;
      }
      if (performance.highlights.includes('finale')) {
        weeklyEntry.points += 15; // Making the finale
      }
      if (performance.highlights.includes('top chef')) {
        weeklyEntry.points = 30; // Overrides finale points, max 30
      }
      // No points deducted for elimination unless specified

      if (performance.highlights.includes('eliminated')) {
        chef.status = 'eliminated';
        chef.eliminationWeek = week;
        chef.stats.eliminations += 1;
        // No point deduction per your rules
      }

      // Add weekly performance
      chef.weeklyPerformance.push(weeklyEntry);

      // Update total points
      chef.stats.totalPoints += weeklyEntry.points;

      await chef.save();
      results.push(chef);
    }
  }

  res.json(results);
});