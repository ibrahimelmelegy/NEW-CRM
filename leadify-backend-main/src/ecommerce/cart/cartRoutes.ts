import { Router } from 'express';
import cartController from './cartController';
import { authenticateUser } from '../../middleware/authMiddleware';

const router = Router();

// ─── Shopping Cart ───────────────────────────────────────────────────────────

router.get('/', authenticateUser, cartController.getCarts);
router.get('/abandoned', authenticateUser, cartController.getAbandonedCarts);
router.get('/active/:clientId', authenticateUser, cartController.getActiveCart);
router.get('/:id', authenticateUser, cartController.getCartById);
router.post('/:id/items', authenticateUser, cartController.addItem);
router.put('/items/:itemId', authenticateUser, cartController.updateItem);
router.delete('/items/:itemId', authenticateUser, cartController.removeItem);
router.delete('/:id/clear', authenticateUser, cartController.clearCart);
router.post('/:id/apply-coupon', authenticateUser, cartController.applyCoupon);
router.post('/:id/convert', authenticateUser, cartController.convertToOrder);

export default router;
