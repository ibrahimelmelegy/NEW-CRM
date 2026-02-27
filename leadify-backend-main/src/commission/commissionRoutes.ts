import express from 'express';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { CommissionPermissionsEnum } from '../role/roleEnum';
import controller from './commissionController';

const router = express.Router();

// Specific routes BEFORE parameterised routes
router.get('/team', authenticateUser, HasPermission([CommissionPermissionsEnum.VIEW_COMMISSIONS]), controller.teamCommissions);
router.get('/analytics', authenticateUser, HasPermission([CommissionPermissionsEnum.VIEW_COMMISSIONS]), controller.analytics);
router.get('/dashboard-kpis', authenticateUser, HasPermission([CommissionPermissionsEnum.VIEW_COMMISSIONS]), controller.dashboardKPIs);
router.get('/summary/:userId', authenticateUser, HasPermission([CommissionPermissionsEnum.VIEW_COMMISSIONS]), controller.summary);
router.post('/calculate', authenticateUser, HasPermission([CommissionPermissionsEnum.CREATE_COMMISSIONS]), controller.calculate);
router.post('/calculate-tiered', authenticateUser, HasPermission([CommissionPermissionsEnum.VIEW_COMMISSIONS]), controller.calculateTiered);
router.post('/apply-plan', authenticateUser, HasPermission([CommissionPermissionsEnum.CREATE_COMMISSIONS]), controller.applyPlan);
router.post('/deal-won', authenticateUser, HasPermission([CommissionPermissionsEnum.CREATE_COMMISSIONS]), controller.dealWon);
router.post('/bulk-payout', authenticateUser, HasPermission([CommissionPermissionsEnum.EDIT_COMMISSIONS]), controller.bulkPayout);

// Standard CRUD
router.get('/', authenticateUser, HasPermission([CommissionPermissionsEnum.VIEW_COMMISSIONS]), controller.getAll);
router.post('/', authenticateUser, HasPermission([CommissionPermissionsEnum.CREATE_COMMISSIONS]), controller.create);
router.put('/:id/pay', authenticateUser, HasPermission([CommissionPermissionsEnum.EDIT_COMMISSIONS]), controller.markAsPaid);
router.put('/:id', authenticateUser, HasPermission([CommissionPermissionsEnum.EDIT_COMMISSIONS]), controller.update);
router.delete('/:id', authenticateUser, HasPermission([CommissionPermissionsEnum.DELETE_COMMISSIONS]), controller.delete);

export default router;
