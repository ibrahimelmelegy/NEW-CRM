import { Router } from 'express';
import ProcurementController from './procurementController';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { ProcurementPermissionsEnum } from '../role/roleEnum';

const router = Router();

router.post('/', authenticateUser, HasPermission([ProcurementPermissionsEnum.CREATE_PROCUREMENT]), ProcurementController.createPurchaseOrder);
router.get('/stats', authenticateUser, HasPermission([ProcurementPermissionsEnum.VIEW_PROCUREMENT]), ProcurementController.getDashboardStats);
router.get('/', authenticateUser, HasPermission([ProcurementPermissionsEnum.VIEW_PROCUREMENT]), ProcurementController.getPurchaseOrders);
router.get('/:id', authenticateUser, HasPermission([ProcurementPermissionsEnum.VIEW_PROCUREMENT]), ProcurementController.getPOById);
router.patch('/:id/approve', authenticateUser, HasPermission([ProcurementPermissionsEnum.APPROVE_PROCUREMENT]), ProcurementController.approvePO);
router.patch('/:id/reject', authenticateUser, HasPermission([ProcurementPermissionsEnum.REJECT_PROCUREMENT]), ProcurementController.rejectPO);
router.delete('/:id', authenticateUser, HasPermission([ProcurementPermissionsEnum.DELETE_PROCUREMENT]), ProcurementController.deletePurchaseOrder);

export default router;
