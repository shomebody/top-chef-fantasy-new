import express from 'express';
import {
  getChefs,
  getChefById,
  createChef,
  updateChef,
  getChefStats,
  updateWeeklyPerformance
} from '../controllers/chefController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected
router.use(protect);

router.route('/')
  .get(getChefs)
  .post(admin, createChef);

router.route('/:id')
  .get(getChefById)
  .put(admin, updateChef);

router.get('/:id/stats', getChefStats);
router.post('/weekly-update', admin, updateWeeklyPerformance);

export default router;
