import { Router } from 'express';
import VendorController from './vendorController';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { VendorPermissionsEnum } from '../role/roleEnum';

const router = Router();

// Define routes
router.post('/', authenticateUser, HasPermission([VendorPermissionsEnum.CREATE_VENDORS]), VendorController.createVendor);
router.get('/all', authenticateUser, HasPermission([VendorPermissionsEnum.VIEW_VENDORS]), VendorController.getAllVendors);
router.get('/', authenticateUser, HasPermission([VendorPermissionsEnum.VIEW_VENDORS]), VendorController.getVendors);
router.get('/:id', authenticateUser, HasPermission([VendorPermissionsEnum.VIEW_VENDORS]), VendorController.getVendorById);
router.put('/:id', authenticateUser, HasPermission([VendorPermissionsEnum.EDIT_VENDORS]), VendorController.updateVendor);
router.delete('/:id', authenticateUser, HasPermission([VendorPermissionsEnum.DELETE_VENDORS]), VendorController.deleteVendor);

export default router;
