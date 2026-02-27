import express from 'express';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { WarrantyPermissionsEnum } from '../role/roleEnum';
import c from './warrantyController';

const router = express.Router();

router.get('/analytics', authenticateUser, HasPermission([WarrantyPermissionsEnum.VIEW_WARRANTIES]), c.getWarrantyAnalytics);
router.get('/expiring', authenticateUser, HasPermission([WarrantyPermissionsEnum.VIEW_WARRANTIES]), c.getExpiringWarranties);
router.get('/', authenticateUser, HasPermission([WarrantyPermissionsEnum.VIEW_WARRANTIES]), c.getWarranties);
router.post('/', authenticateUser, HasPermission([WarrantyPermissionsEnum.CREATE_WARRANTIES]), c.createWarranty);
router.put('/:id', authenticateUser, HasPermission([WarrantyPermissionsEnum.EDIT_WARRANTIES]), c.updateWarranty);
router.delete('/:id', authenticateUser, HasPermission([WarrantyPermissionsEnum.DELETE_WARRANTIES]), c.deleteWarranty);
router.get('/:id/coverage', authenticateUser, HasPermission([WarrantyPermissionsEnum.VIEW_WARRANTIES]), c.checkCoverage);
router.get('/claims', authenticateUser, HasPermission([WarrantyPermissionsEnum.MANAGE_CLAIMS]), c.getClaims);
router.post('/claims', authenticateUser, HasPermission([WarrantyPermissionsEnum.MANAGE_CLAIMS]), c.createClaim);
router.post('/claims/validated', authenticateUser, HasPermission([WarrantyPermissionsEnum.MANAGE_CLAIMS]), c.createClaimWithValidation);
router.put('/claims/:id', authenticateUser, HasPermission([WarrantyPermissionsEnum.MANAGE_CLAIMS]), c.updateClaim);

export default router;
