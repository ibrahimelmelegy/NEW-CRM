import express from 'express';
import { authenticateUser } from '../middleware/authMiddleware';
import controller from './accountPlanController';

const router = express.Router();

// ─── Analytics (before parameterised routes) ────────────────────────────────
router.get('/whitespace', authenticateUser, controller.getWhitespace);
router.get('/forecast', authenticateUser, controller.getForecast);

// ─── Standard CRUD ──────────────────────────────────────────────────────────
router.get('/', authenticateUser, controller.getAll);
router.get('/:id', authenticateUser, controller.getById);
router.post('/', authenticateUser, controller.create);
router.put('/:id', authenticateUser, controller.update);
router.delete('/:id', authenticateUser, controller.delete);

// ─── Stakeholders ───────────────────────────────────────────────────────────
router.get('/:id/stakeholders', authenticateUser, controller.getStakeholders);
router.post('/:id/stakeholders', authenticateUser, controller.addStakeholder);
router.put('/:id/stakeholders/:stakeholderId', authenticateUser, controller.updateStakeholder);
router.delete('/:id/stakeholders/:stakeholderId', authenticateUser, controller.deleteStakeholder);

export default router;
