import express from 'express';
import {
  getProblems,
  getProblemById,
  createProblem,
  updateProblem,
  deleteProblem,
} from '../controllers/problemController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { verifyAdmin }  from '../middleware/adminMiddleware.js';
import { runCode, submitCode } from '../judge/judgeHandler.js';

const router = express.Router();

router.get('/',        verifyToken, getProblems);
router.get('/:id',     verifyToken, getProblemById);
router.post('/run',    verifyToken, runCode);
router.post('/submit', verifyToken, submitCode);
router.post('/',       verifyToken, verifyAdmin, createProblem);
router.patch('/:id',   verifyToken, verifyAdmin, updateProblem);
router.delete('/:id',  verifyToken, verifyAdmin, deleteProblem);

export default router;