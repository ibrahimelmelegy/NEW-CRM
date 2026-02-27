import express from 'express';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { GoalPermissionsEnum } from '../role/roleEnum';
import controller from './goalController';

const router = express.Router();

router.get('/', authenticateUser, HasPermission([GoalPermissionsEnum.VIEW_GOALS]), controller.getAll);
router.get('/stats', authenticateUser, HasPermission([GoalPermissionsEnum.VIEW_GOALS]), controller.getStats);
router.get('/overdue', authenticateUser, HasPermission([GoalPermissionsEnum.VIEW_GOALS]), controller.getOverdue);
router.get('/:id', authenticateUser, HasPermission([GoalPermissionsEnum.VIEW_GOALS]), controller.getById);
router.get('/:id/milestones', authenticateUser, HasPermission([GoalPermissionsEnum.VIEW_GOALS]), controller.checkMilestones);
router.post('/', authenticateUser, HasPermission([GoalPermissionsEnum.CREATE_GOALS]), controller.create);
router.put('/:id', authenticateUser, HasPermission([GoalPermissionsEnum.EDIT_GOALS]), controller.update);
router.put('/:id/progress', authenticateUser, HasPermission([GoalPermissionsEnum.EDIT_GOALS]), controller.updateProgress);
router.delete('/:id', authenticateUser, HasPermission([GoalPermissionsEnum.DELETE_GOALS]), controller.delete);

export default router;
