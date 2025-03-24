// server/src/routes/chefRoutes.js
import express from 'express';
import { getChefs, getChefById, createChef, updateChef, getChefStats, updateWeeklyPerformance } from '../controllers/chefController.js';

const router = express.Router();

router.get('/', getChefs);
router.get('/:id', getChefById);
router.post('/', createChef); // Admin only
router.put('/:id', updateChef); // Admin only
router.get('/:id/stats', getChefStats);
router.put('/:id/weekly-performance', updateWeeklyPerformance); // Assumed route causing error

export default router;