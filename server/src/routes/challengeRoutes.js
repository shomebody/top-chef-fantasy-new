import express from 'express';
import {
  getChallenges,
  getChallengeById,
  createChallenge,
  updateChallenge,
  getCurrentChallenges
} from '../controllers/challengeController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected
router.use(protect);

router.route('/')
  .get(getChallenges)
  .post(admin, createChallenge);

router.get('/current', getCurrentChallenges);

router.route('/:id')
  .get(getChallengeById)
  .put(admin, updateChallenge);

export default router;
