import express from 'express';
import {
  getLeagueMessages,
  createMessage,
  addReaction,
  getUnreadCount
} from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected
router.use(protect);

router.post('/', createMessage);
router.get('/:leagueId', getLeagueMessages);
router.post('/:id/reaction', addReaction);
router.get('/unread/:leagueId', getUnreadCount);

export default router;
