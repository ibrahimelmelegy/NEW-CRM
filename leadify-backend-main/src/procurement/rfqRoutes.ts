import { Router } from 'express';
import RFQController from './rfqController';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
// Assuming generic Create Project permission covers RFQ for now, or we define new ones
import { ProcurementPermissionsEnum } from '../role/roleEnum';

const router = Router();

router.post('/', authenticateUser, HasPermission([ProcurementPermissionsEnum.CREATE_PROCUREMENT]), RFQController.createRFQ);
router.get('/', authenticateUser, HasPermission([ProcurementPermissionsEnum.VIEW_PROCUREMENT]), RFQController.getAllRFQs);
router.get('/:id', authenticateUser, HasPermission([ProcurementPermissionsEnum.VIEW_PROCUREMENT]), RFQController.getRFQById);
router.post('/:id/send', authenticateUser, HasPermission([ProcurementPermissionsEnum.CREATE_PROCUREMENT]), RFQController.sendRFQ);
router.post('/:id/vendors/:vendorId/response', authenticateUser, HasPermission([ProcurementPermissionsEnum.CREATE_PROCUREMENT]), RFQController.addVendorResponse);

export default router;
