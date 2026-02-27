import express from 'express';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { WarehousePermissionsEnum } from '../role/roleEnum';
import c from './warehouseController';

const router = express.Router();

router.get('/', authenticateUser, HasPermission([WarehousePermissionsEnum.VIEW_WAREHOUSES]), c.getWarehouses);
router.post('/', authenticateUser, HasPermission([WarehousePermissionsEnum.CREATE_WAREHOUSES]), c.createWarehouse);
router.put('/:id', authenticateUser, HasPermission([WarehousePermissionsEnum.EDIT_WAREHOUSES]), c.updateWarehouse);
router.delete('/:id', authenticateUser, HasPermission([WarehousePermissionsEnum.DELETE_WAREHOUSES]), c.deleteWarehouse);
router.post('/zones', authenticateUser, HasPermission([WarehousePermissionsEnum.MANAGE_ZONES]), c.createZone);
router.delete('/zones/:id', authenticateUser, HasPermission([WarehousePermissionsEnum.MANAGE_ZONES]), c.deleteZone);
router.get('/transfers', authenticateUser, HasPermission([WarehousePermissionsEnum.MANAGE_TRANSFERS]), c.getTransfers);
router.post('/transfers', authenticateUser, HasPermission([WarehousePermissionsEnum.MANAGE_TRANSFERS]), c.createTransfer);
router.put('/transfers/:id', authenticateUser, HasPermission([WarehousePermissionsEnum.MANAGE_TRANSFERS]), c.updateTransfer);

export default router;
