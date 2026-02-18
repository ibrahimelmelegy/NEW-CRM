import { Router } from 'express';
import InventoryController from './inventoryController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = Router();

// Product routes - specific routes before parameterized routes
router.get('/products/low-stock', authenticateUser, InventoryController.getLowStock);
router.get('/products/categories', authenticateUser, InventoryController.getCategories);
router.get('/products/warehouses', authenticateUser, InventoryController.getWarehouses);

// Product CRUD
router.get('/products', authenticateUser, InventoryController.getProducts);
router.get('/products/:id', authenticateUser, InventoryController.getProductById);
router.post('/products', authenticateUser, InventoryController.createProduct);
router.put('/products/:id', authenticateUser, InventoryController.updateProduct);
router.delete('/products/:id', authenticateUser, InventoryController.deleteProduct);

// Stock movement routes
router.get('/products/:id/movements', authenticateUser, InventoryController.getMovements);
router.post('/movements', authenticateUser, InventoryController.addMovement);

export default router;
