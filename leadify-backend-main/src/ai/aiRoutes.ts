import express from 'express';
import { generateEmail, summarizeMeeting } from './aiController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = express.Router();

// Protected routes
router.post('/generate-email', authenticateUser, generateEmail);
router.post('/summarize-meeting', authenticateUser, summarizeMeeting);

export default router;
