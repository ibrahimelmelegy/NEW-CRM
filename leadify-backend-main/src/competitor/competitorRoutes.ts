import express from 'express';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { CompetitorPermissionsEnum } from '../role/roleEnum';
import controller from './competitorController';

const router = express.Router();

router.get('/', authenticateUser, HasPermission([CompetitorPermissionsEnum.VIEW_COMPETITORS]), controller.getAll);
router.get('/:id', authenticateUser, HasPermission([CompetitorPermissionsEnum.VIEW_COMPETITORS]), controller.getById);
router.post('/', authenticateUser, HasPermission([CompetitorPermissionsEnum.CREATE_COMPETITORS]), controller.create);
router.put('/:id', authenticateUser, HasPermission([CompetitorPermissionsEnum.EDIT_COMPETITORS]), controller.update);
router.delete('/:id', authenticateUser, HasPermission([CompetitorPermissionsEnum.DELETE_COMPETITORS]), controller.delete);

export default router;
