import express from 'express';
import {
  createLeague,
  getUserLeagues,
  getLeagueById,
  updateLeague,
  joinLeague,
  updateDraftOrder,
  draftChef,
  getLeagueLeaderboard
} from '../controllers/leagueController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected
router.use(protect);

router.route('/')
  .get(getUserLeagues)
  .post(createLeague);

router.post('/join', joinLeague);

router.route('/:id')
  .get(getLeagueById)
  .put(updateLeague);

router.put('/:id/draft-order', updateDraftOrder);
router.post('/:id/draft', draftChef);
router.get('/:id/leaderboard', getLeagueLeaderboard);

export default router;
