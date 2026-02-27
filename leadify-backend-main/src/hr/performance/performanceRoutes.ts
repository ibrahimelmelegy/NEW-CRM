import express from 'express';
import { authenticateUser, HasPermission } from '../../middleware/authMiddleware';
import { PerformancePermissionsEnum } from '../../role/roleEnum';
import controller from './performanceController';

const router = express.Router();

router.get('/', authenticateUser, HasPermission([PerformancePermissionsEnum.VIEW_PERFORMANCE]), controller.getAll);
router.get('/distribution', authenticateUser, HasPermission([PerformancePermissionsEnum.VIEW_PERFORMANCE]), controller.getDistribution);
router.get('/team/:managerId', authenticateUser, HasPermission([PerformancePermissionsEnum.VIEW_PERFORMANCE]), controller.getTeamPerformance);
router.get('/compare/:employeeId', authenticateUser, HasPermission([PerformancePermissionsEnum.VIEW_PERFORMANCE]), controller.comparePerformance);
router.get('/:id', authenticateUser, HasPermission([PerformancePermissionsEnum.VIEW_PERFORMANCE]), controller.getById);
router.post('/', authenticateUser, HasPermission([PerformancePermissionsEnum.CREATE_PERFORMANCE]), controller.create);
router.put('/:id', authenticateUser, HasPermission([PerformancePermissionsEnum.EDIT_PERFORMANCE]), controller.update);
router.put('/:id/calculate-rating', authenticateUser, HasPermission([PerformancePermissionsEnum.EDIT_PERFORMANCE]), controller.calculateRating);
router.put('/:id/submit', authenticateUser, HasPermission([PerformancePermissionsEnum.EDIT_PERFORMANCE]), controller.submitReview);
router.put('/:id/approve', authenticateUser, HasPermission([PerformancePermissionsEnum.EDIT_PERFORMANCE]), controller.approveReview);
router.delete('/:id', authenticateUser, HasPermission([PerformancePermissionsEnum.DELETE_PERFORMANCE]), controller.delete);

export default router;
