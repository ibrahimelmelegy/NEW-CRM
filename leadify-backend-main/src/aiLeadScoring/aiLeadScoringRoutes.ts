import express from 'express';
import { authenticateUser } from '../middleware/authMiddleware';
import controller from './aiLeadScoringController';

const router = express.Router();

// ─── Model Comparison (before parameterised routes) ─────────────────────────
router.post('/compare', authenticateUser, controller.compareModels);

// ─── Standard CRUD ──────────────────────────────────────────────────────────
router.get('/', authenticateUser, controller.getAll);
router.get('/:id', authenticateUser, controller.getById);
router.post('/', authenticateUser, controller.create);
router.put('/:id', authenticateUser, controller.update);
router.delete('/:id', authenticateUser, controller.delete);

// ─── Scoring & Analysis ────────────────────────────────────────────────────
router.post('/:id/score', authenticateUser, controller.scoreLeads);
router.get('/:id/feature-importance', authenticateUser, controller.getFeatureImportance);

export default router;
