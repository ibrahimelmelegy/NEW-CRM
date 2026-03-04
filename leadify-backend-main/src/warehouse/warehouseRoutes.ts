import express from 'express';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { WarehousePermissionsEnum } from '../role/roleEnum';
import c from './warehouseController';

const router = express.Router();

// Static routes first (must come before /:id to avoid shadowing)
router.get('/low-stock', authenticateUser, HasPermission([WarehousePermissionsEnum.VIEW_WAREHOUSES]), c.getLowStockAlerts);
router.get('/zones', authenticateUser, HasPermission([WarehousePermissionsEnum.VIEW_WAREHOUSES]), c.getZones);
router.post('/zones', authenticateUser, HasPermission([WarehousePermissionsEnum.MANAGE_ZONES]), c.createZone);
router.delete('/zones/:id', authenticateUser, HasPermission([WarehousePermissionsEnum.MANAGE_ZONES]), c.deleteZone);
router.get('/stock', authenticateUser, HasPermission([WarehousePermissionsEnum.VIEW_WAREHOUSES]), c.getStockCount);
router.get('/transfers', authenticateUser, HasPermission([WarehousePermissionsEnum.MANAGE_TRANSFERS]), c.getTransfers);
router.post('/transfers', authenticateUser, HasPermission([WarehousePermissionsEnum.MANAGE_TRANSFERS]), c.createTransfer);
router.put('/transfers/:id', authenticateUser, HasPermission([WarehousePermissionsEnum.MANAGE_TRANSFERS]), c.updateTransfer);
router.put('/transfers/:id/process', authenticateUser, HasPermission([WarehousePermissionsEnum.MANAGE_TRANSFERS]), c.processTransfer);

// Collection routes
router.get('/', authenticateUser, HasPermission([WarehousePermissionsEnum.VIEW_WAREHOUSES]), c.getWarehouses);
router.post('/', authenticateUser, HasPermission([WarehousePermissionsEnum.CREATE_WAREHOUSES]), c.createWarehouse);

// Dynamic /:id routes (after all statics)
router.get('/:id', authenticateUser, HasPermission([WarehousePermissionsEnum.VIEW_WAREHOUSES]), c.getWarehouseById);
router.get('/:id/stock-summary', authenticateUser, HasPermission([WarehousePermissionsEnum.VIEW_WAREHOUSES]), c.getStockSummary);
router.get('/:id/movement', authenticateUser, HasPermission([WarehousePermissionsEnum.VIEW_WAREHOUSES]), c.getInventoryMovement);
router.post('/:id/pick-pack', authenticateUser, HasPermission([WarehousePermissionsEnum.MANAGE_TRANSFERS]), c.pickAndPack);
router.put('/:id/stock', authenticateUser, HasPermission([WarehousePermissionsEnum.MANAGE_TRANSFERS]), c.updateStockLevels);
router.put('/:id', authenticateUser, HasPermission([WarehousePermissionsEnum.EDIT_WAREHOUSES]), c.updateWarehouse);
router.delete('/:id', authenticateUser, HasPermission([WarehousePermissionsEnum.DELETE_WAREHOUSES]), c.deleteWarehouse);

export default router;
