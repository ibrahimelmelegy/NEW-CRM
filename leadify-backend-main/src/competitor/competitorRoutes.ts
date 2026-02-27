import express from 'express';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { CompetitorPermissionsEnum } from '../role/roleEnum';
import controller from './competitorController';

const router = express.Router();

// ─── Analytics (specific routes BEFORE parameterised routes) ────────────────
router.get('/threat-matrix', authenticateUser, HasPermission([CompetitorPermissionsEnum.VIEW_COMPETITORS]), controller.threatMatrix);
router.get('/analytics/landscape', authenticateUser, HasPermission([CompetitorPermissionsEnum.VIEW_COMPETITORS]), controller.marketLandscape);
router.get('/analytics/top-threats', authenticateUser, HasPermission([CompetitorPermissionsEnum.VIEW_COMPETITORS]), controller.topThreats);
router.get('/analytics/win-rates', authenticateUser, HasPermission([CompetitorPermissionsEnum.VIEW_COMPETITORS]), controller.winRateStats);
router.get('/analysis/:id', authenticateUser, HasPermission([CompetitorPermissionsEnum.VIEW_COMPETITORS]), controller.analysis);

// ─── Standard CRUD ──────────────────────────────────────────────────────────
router.get('/', authenticateUser, HasPermission([CompetitorPermissionsEnum.VIEW_COMPETITORS]), controller.getAll);
router.get('/:id', authenticateUser, HasPermission([CompetitorPermissionsEnum.VIEW_COMPETITORS]), controller.getById);
router.post('/', authenticateUser, HasPermission([CompetitorPermissionsEnum.CREATE_COMPETITORS]), controller.create);
router.put('/:id/threat-level', authenticateUser, HasPermission([CompetitorPermissionsEnum.EDIT_COMPETITORS]), controller.updateThreatLevel);
router.put('/:id', authenticateUser, HasPermission([CompetitorPermissionsEnum.EDIT_COMPETITORS]), controller.update);
router.delete('/:id', authenticateUser, HasPermission([CompetitorPermissionsEnum.DELETE_COMPETITORS]), controller.delete);

// ─── Deal Association ───────────────────────────────────────────────────────
router.get('/:id/deals', authenticateUser, HasPermission([CompetitorPermissionsEnum.VIEW_COMPETITORS]), controller.getCompetitorDeals);
router.post('/:id/deals', authenticateUser, HasPermission([CompetitorPermissionsEnum.EDIT_COMPETITORS]), controller.linkDeal);
router.delete('/:id/deals/:dealId', authenticateUser, HasPermission([CompetitorPermissionsEnum.EDIT_COMPETITORS]), controller.unlinkDeal);

export default router;
