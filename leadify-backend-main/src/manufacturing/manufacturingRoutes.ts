import { Router } from 'express';
import manufacturingController from './manufacturingController';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { ManufacturingPermissionsEnum } from '../role/roleEnum';

const router = Router();

router.use(authenticateUser);

// BOM
router.get('/bom', HasPermission([ManufacturingPermissionsEnum.VIEW_MANUFACTURING]), manufacturingController.getBOMs);
router.get('/bom/:id', HasPermission([ManufacturingPermissionsEnum.VIEW_MANUFACTURING]), manufacturingController.getBOMById);
router.post('/bom', HasPermission([ManufacturingPermissionsEnum.CREATE_MANUFACTURING]), manufacturingController.createBOM);
router.patch('/bom/:id', HasPermission([ManufacturingPermissionsEnum.EDIT_MANUFACTURING]), manufacturingController.updateBOM);
router.delete('/bom/:id', HasPermission([ManufacturingPermissionsEnum.DELETE_MANUFACTURING]), manufacturingController.deleteBOM);
router.post('/bom/:id/duplicate', HasPermission([ManufacturingPermissionsEnum.CREATE_MANUFACTURING]), manufacturingController.duplicateBOM);

// Work Orders
router.get('/work-orders', HasPermission([ManufacturingPermissionsEnum.VIEW_MANUFACTURING]), manufacturingController.getWorkOrders);
router.get('/work-orders/:id', HasPermission([ManufacturingPermissionsEnum.VIEW_MANUFACTURING]), manufacturingController.getWorkOrderById);
router.post('/work-orders', HasPermission([ManufacturingPermissionsEnum.CREATE_MANUFACTURING]), manufacturingController.createWorkOrder);
router.patch('/work-orders/:id', HasPermission([ManufacturingPermissionsEnum.EDIT_MANUFACTURING]), manufacturingController.updateWorkOrder);
router.patch('/work-orders/:id/production', HasPermission([ManufacturingPermissionsEnum.EDIT_MANUFACTURING]), manufacturingController.updateProduction);

// Quality Checks
router.get('/quality', HasPermission([ManufacturingPermissionsEnum.VIEW_MANUFACTURING]), manufacturingController.getQualityChecks);
router.post('/quality', HasPermission([ManufacturingPermissionsEnum.CREATE_MANUFACTURING]), manufacturingController.createQualityCheck);

// Stats
router.get('/stats', HasPermission([ManufacturingPermissionsEnum.VIEW_MANUFACTURING]), manufacturingController.getStats);

export default router;
