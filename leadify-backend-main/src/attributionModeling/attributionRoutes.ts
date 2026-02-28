import express from 'express';
import { authenticateUser } from '../middleware/authMiddleware';
import controller from './attributionController';

const router = express.Router();

// ─── Analytics (before parameterised routes) ────────────────────────────────
router.get('/channels', authenticateUser, controller.getChannelPerformance);

// ─── Attribution Actions ────────────────────────────────────────────────────
router.post('/calculate', authenticateUser, controller.calculate);
router.post('/compare', authenticateUser, controller.compareModels);

// ─── Standard CRUD ──────────────────────────────────────────────────────────
router.get('/', authenticateUser, controller.getAll);
router.get('/:id', authenticateUser, controller.getById);
router.post('/', authenticateUser, controller.create);
router.put('/:id', authenticateUser, controller.update);
router.delete('/:id', authenticateUser, controller.delete);

export default router;
