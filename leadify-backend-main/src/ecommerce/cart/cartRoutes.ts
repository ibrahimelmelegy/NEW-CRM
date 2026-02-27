import { Router } from 'express';
import cartController from './cartController';
import { authenticateUser, HasPermission } from '../../middleware/authMiddleware';
import { EcCartPermissionsEnum } from '../../role/roleEnum';

const router = Router();

// ─── Shopping Cart ───────────────────────────────────────────────────────────

router.get('/', authenticateUser, HasPermission([EcCartPermissionsEnum.VIEW_EC_CARTS]), cartController.getCarts);
router.get('/abandoned', authenticateUser, HasPermission([EcCartPermissionsEnum.VIEW_EC_CARTS]), cartController.getAbandonedCarts);
router.get('/active/:clientId', authenticateUser, HasPermission([EcCartPermissionsEnum.VIEW_EC_CARTS]), cartController.getActiveCart);
router.get('/:id', authenticateUser, HasPermission([EcCartPermissionsEnum.VIEW_EC_CARTS]), cartController.getCartById);
router.post('/:id/items', authenticateUser, HasPermission([EcCartPermissionsEnum.MANAGE_EC_CARTS]), cartController.addItem);
router.put('/items/:itemId', authenticateUser, HasPermission([EcCartPermissionsEnum.MANAGE_EC_CARTS]), cartController.updateItem);
router.delete('/items/:itemId', authenticateUser, HasPermission([EcCartPermissionsEnum.MANAGE_EC_CARTS]), cartController.removeItem);
router.delete('/:id/clear', authenticateUser, HasPermission([EcCartPermissionsEnum.MANAGE_EC_CARTS]), cartController.clearCart);
router.post('/:id/apply-coupon', authenticateUser, HasPermission([EcCartPermissionsEnum.MANAGE_EC_CARTS]), cartController.applyCoupon);
router.post('/:id/convert', authenticateUser, HasPermission([EcCartPermissionsEnum.CONVERT_EC_CARTS]), cartController.convertToOrder);

export default router;
