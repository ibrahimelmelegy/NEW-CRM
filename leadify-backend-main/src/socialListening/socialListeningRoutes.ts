import express from 'express';
import { authenticateUser } from '../middleware/authMiddleware';
import controller from './socialListeningController';

const router = express.Router();

// ─── Analytics (before parameterised routes) ────────────────────────────────
router.get('/sentiment', authenticateUser, controller.getSentimentAggregation);
router.get('/trending', authenticateUser, controller.getTrendingKeywords);

// ─── Standard CRUD ──────────────────────────────────────────────────────────
router.get('/', authenticateUser, controller.getAll);
router.get('/:id', authenticateUser, controller.getById);
router.post('/', authenticateUser, controller.create);
router.put('/:id', authenticateUser, controller.update);
router.delete('/:id', authenticateUser, controller.delete);

export default router;
