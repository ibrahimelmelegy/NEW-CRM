import express from 'express';
import { authenticateUser } from '../middleware/authMiddleware';
import controller from './clvController';

const router = express.Router();

// ─── Analytics (before parameterised routes) ────────────────────────────────
router.get('/cohorts', authenticateUser, controller.getCohortAnalysis);
router.get('/churn-predictions', authenticateUser, controller.getChurnPredictions);

// ─── Calculate CLV ──────────────────────────────────────────────────────────
router.post('/calculate', authenticateUser, controller.calculate);

// ─── Standard CRUD ──────────────────────────────────────────────────────────
router.get('/', authenticateUser, controller.getAll);
router.get('/:id', authenticateUser, controller.getById);
router.post('/', authenticateUser, controller.create);
router.put('/:id', authenticateUser, controller.update);
router.delete('/:id', authenticateUser, controller.delete);

export default router;
