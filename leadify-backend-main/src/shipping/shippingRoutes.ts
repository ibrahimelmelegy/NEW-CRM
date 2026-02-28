import express from 'express';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { ShippingPermissionsEnum } from '../role/roleEnum';
import c from './shippingController';

const router = express.Router();

router.get('/analytics', authenticateUser, HasPermission([ShippingPermissionsEnum.VIEW_SHIPMENTS]), c.getShippingAnalytics);
router.get('/calculate-rate', authenticateUser, HasPermission([ShippingPermissionsEnum.VIEW_SHIPMENTS]), c.calculateRate);
router.get('/carrier-rates', authenticateUser, HasPermission([ShippingPermissionsEnum.VIEW_SHIPMENTS]), c.getCarrierRates);
router.get('/track/:trackingNumber', authenticateUser, HasPermission([ShippingPermissionsEnum.VIEW_SHIPMENTS]), c.getShipmentTracking);
router.post('/bulk-status', authenticateUser, HasPermission([ShippingPermissionsEnum.EDIT_SHIPMENTS]), c.bulkUpdateStatus);
router.get('/', authenticateUser, HasPermission([ShippingPermissionsEnum.VIEW_SHIPMENTS]), c.getShipments);
router.post('/', authenticateUser, HasPermission([ShippingPermissionsEnum.CREATE_SHIPMENTS]), c.createShipment);
router.put('/:id', authenticateUser, HasPermission([ShippingPermissionsEnum.EDIT_SHIPMENTS]), c.updateShipment);
router.put('/:id/status', authenticateUser, HasPermission([ShippingPermissionsEnum.EDIT_SHIPMENTS]), c.updateShipmentStatus);
router.delete('/:id', authenticateUser, HasPermission([ShippingPermissionsEnum.DELETE_SHIPMENTS]), c.deleteShipment);
router.get('/rates', authenticateUser, HasPermission([ShippingPermissionsEnum.MANAGE_RATES]), c.getRates);
router.post('/rates', authenticateUser, HasPermission([ShippingPermissionsEnum.MANAGE_RATES]), c.createRate);
router.put('/rates/:id', authenticateUser, HasPermission([ShippingPermissionsEnum.MANAGE_RATES]), c.updateRate);
router.delete('/rates/:id', authenticateUser, HasPermission([ShippingPermissionsEnum.MANAGE_RATES]), c.deleteRate);

export default router;
