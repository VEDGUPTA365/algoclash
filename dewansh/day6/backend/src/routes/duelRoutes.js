import express from 'express';
import {
  createDuel,
  joinDuel,
  getDuelByRoom,
  submitDuelCode,
  getLeaderboard,
} from '../controllers/duelController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/',                     verifyToken, createDuel);
router.get('/leaderboard',           verifyToken, getLeaderboard);
router.get('/:roomCode',             verifyToken, getDuelByRoom);
router.post('/join/:roomCode',       verifyToken, joinDuel);
router.post('/submit/:roomCode',     verifyToken, submitDuelCode);

export default router;
