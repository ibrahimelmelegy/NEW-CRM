import express from 'express';
import { authenticateUser } from '../middleware/authMiddleware';
import controller from './segmentController';

const router = express.Router();

// ─── Analytics (before parameterised routes) ────────────────────────────────
router.get('/distribution', authenticateUser, controller.getDistribution);

// ─── Standard CRUD ──────────────────────────────────────────────────────────
router.get('/', authenticateUser, controller.getAll);
router.get('/:id', authenticateUser, controller.getById);
router.post('/', authenticateUser, controller.create);
router.put('/:id', authenticateUser, controller.update);
router.delete('/:id', authenticateUser, controller.delete);

// ─── Evaluate Segment ───────────────────────────────────────────────────────
router.post('/:id/evaluate', authenticateUser, controller.evaluate);

export default router;
