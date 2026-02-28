import express from 'express';
import { authenticateUser } from '../middleware/authMiddleware';
import controller from './cartRecoveryController';

const router = express.Router();

// ─── Analytics & Batch Operations (before parameterised routes) ─────────────
router.get('/stats', authenticateUser, controller.getStats);
router.post('/expire', authenticateUser, controller.expireOldCarts);

// ─── Standard CRUD ──────────────────────────────────────────────────────────
router.get('/', authenticateUser, controller.getAll);
router.get('/:id', authenticateUser, controller.getById);
router.post('/', authenticateUser, controller.create);
router.put('/:id', authenticateUser, controller.update);
router.delete('/:id', authenticateUser, controller.delete);

// ─── Recovery Actions ───────────────────────────────────────────────────────
router.post('/:id/remind', authenticateUser, controller.sendReminder);
router.post('/:id/recover', authenticateUser, controller.markRecovered);

export default router;
