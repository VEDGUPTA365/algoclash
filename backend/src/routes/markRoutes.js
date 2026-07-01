import express from 'express';
import { toggleMark } from '../controllers/markController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/toggle', verifyToken, toggleMark);

export default router;
