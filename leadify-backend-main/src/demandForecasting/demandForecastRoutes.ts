import express from 'express';
import { authenticateUser } from '../middleware/authMiddleware';
import controller from './demandForecastController';

const router = express.Router();

// ─── Analytics (before parameterised routes) ────────────────────────────────
router.get('/accuracy', authenticateUser, controller.getAccuracyReport);

// ─── Generate Forecast ──────────────────────────────────────────────────────
router.post('/generate', authenticateUser, controller.generate);

// ─── Standard CRUD ──────────────────────────────────────────────────────────
router.get('/', authenticateUser, controller.getAll);
router.get('/:id', authenticateUser, controller.getById);
router.post('/', authenticateUser, controller.create);
router.put('/:id', authenticateUser, controller.update);
router.delete('/:id', authenticateUser, controller.delete);

export default router;
