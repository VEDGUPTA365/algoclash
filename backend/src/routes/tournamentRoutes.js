import express from 'express';
import {
  createTournament,
  getTournaments,
  joinTournament,
  getTournamentDetails,
  startTournament,
  endTournament,
  submitTournamentCode,
  getTournamentLeaderboard,
} from '../controllers/tournamentController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { verifyAdmin } from '../middleware/adminMiddleware.js';

const router = express.Router();

router.post('/', verifyToken, verifyAdmin, createTournament);
router.get('/', verifyToken, getTournaments);
router.post('/join', verifyToken, joinTournament);
router.get('/:id', verifyToken, getTournamentDetails);
router.post('/:id/start', verifyToken, verifyAdmin, startTournament);
router.post('/:id/end', verifyToken, verifyAdmin, endTournament);
router.post('/:id/submit', verifyToken, submitTournamentCode);
router.get('/:id/leaderboard', verifyToken, getTournamentLeaderboard);

export default router;
