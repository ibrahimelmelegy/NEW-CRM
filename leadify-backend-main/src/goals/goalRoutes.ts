import express from 'express';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { GoalPermissionsEnum } from '../role/roleEnum';
import controller from './goalController';

const router = express.Router();

router.get('/', authenticateUser, HasPermission([GoalPermissionsEnum.VIEW_GOALS]), controller.getAll);
router.get('/:id', authenticateUser, HasPermission([GoalPermissionsEnum.VIEW_GOALS]), controller.getById);
router.post('/', authenticateUser, HasPermission([GoalPermissionsEnum.CREATE_GOALS]), controller.create);
router.put('/:id', authenticateUser, HasPermission([GoalPermissionsEnum.EDIT_GOALS]), controller.update);
router.delete('/:id', authenticateUser, HasPermission([GoalPermissionsEnum.DELETE_GOALS]), controller.delete);

export default router;
