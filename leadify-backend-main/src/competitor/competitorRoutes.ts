import express from 'express';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { CompetitorPermissionsEnum } from '../role/roleEnum';
import controller from './competitorController';

const router = express.Router();

// Specific routes BEFORE parameterised routes
router.get('/threat-matrix', authenticateUser, HasPermission([CompetitorPermissionsEnum.VIEW_COMPETITORS]), controller.threatMatrix);
router.get('/analysis/:id', authenticateUser, HasPermission([CompetitorPermissionsEnum.VIEW_COMPETITORS]), controller.analysis);

// Standard CRUD
router.get('/', authenticateUser, HasPermission([CompetitorPermissionsEnum.VIEW_COMPETITORS]), controller.getAll);
router.get('/:id', authenticateUser, HasPermission([CompetitorPermissionsEnum.VIEW_COMPETITORS]), controller.getById);
router.post('/', authenticateUser, HasPermission([CompetitorPermissionsEnum.CREATE_COMPETITORS]), controller.create);
router.put('/:id/threat-level', authenticateUser, HasPermission([CompetitorPermissionsEnum.EDIT_COMPETITORS]), controller.updateThreatLevel);
router.put('/:id', authenticateUser, HasPermission([CompetitorPermissionsEnum.EDIT_COMPETITORS]), controller.update);
router.delete('/:id', authenticateUser, HasPermission([CompetitorPermissionsEnum.DELETE_COMPETITORS]), controller.delete);

export default router;
