import { Router } from 'express';
import productController from './productController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = Router();

// Product CRUD
router.get('/products', authenticateUser, productController.getProducts);
router.post('/products', authenticateUser, productController.createProduct);
router.put('/products/:id', authenticateUser, productController.updateProduct);
router.delete('/products/:id', authenticateUser, productController.deleteProduct);

// Quote line routes
router.get('/quotes/:quoteId/lines', authenticateUser, productController.getQuoteLines);
router.post('/quotes/lines', authenticateUser, productController.addQuoteLine);
router.put('/quotes/lines/:id', authenticateUser, productController.updateQuoteLine);
router.delete('/quotes/lines/:id', authenticateUser, productController.removeQuoteLine);

export default router;
