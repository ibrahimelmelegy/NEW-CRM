import express from 'express';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { CommissionPermissionsEnum } from '../role/roleEnum';
import controller from './commissionController';

const router = express.Router();

router.get('/', authenticateUser, HasPermission([CommissionPermissionsEnum.VIEW_COMMISSIONS]), controller.getAll);
router.post('/', authenticateUser, HasPermission([CommissionPermissionsEnum.CREATE_COMMISSIONS]), controller.create);
router.put('/:id', authenticateUser, HasPermission([CommissionPermissionsEnum.EDIT_COMMISSIONS]), controller.update);
router.delete('/:id', authenticateUser, HasPermission([CommissionPermissionsEnum.DELETE_COMMISSIONS]), controller.delete);

export default router;
