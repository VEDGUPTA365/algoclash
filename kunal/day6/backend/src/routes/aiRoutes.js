import express from 'express';
import { analyzeCode } from '../controllers/aiController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Route is restricted to authenticated users to prevent abuse
router.post('/analyze', verifyToken, analyzeCode);

export default router;
