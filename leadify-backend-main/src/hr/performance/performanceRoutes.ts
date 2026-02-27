import express from 'express';
import { authenticateUser, HasPermission } from '../../middleware/authMiddleware';
import { PerformancePermissionsEnum } from '../../role/roleEnum';
import controller from './performanceController';

const router = express.Router();

router.get('/', authenticateUser, HasPermission([PerformancePermissionsEnum.VIEW_PERFORMANCE]), controller.getAll);
router.get('/:id', authenticateUser, HasPermission([PerformancePermissionsEnum.VIEW_PERFORMANCE]), controller.getById);
router.post('/', authenticateUser, HasPermission([PerformancePermissionsEnum.CREATE_PERFORMANCE]), controller.create);
router.put('/:id', authenticateUser, HasPermission([PerformancePermissionsEnum.EDIT_PERFORMANCE]), controller.update);
router.delete('/:id', authenticateUser, HasPermission([PerformancePermissionsEnum.DELETE_PERFORMANCE]), controller.delete);

export default router;
