import express from 'express';
import currencyController from './currencyController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = express.Router();

// Currencies
router.get('/currencies', authenticateUser, currencyController.getCurrencies);
router.post('/currencies', authenticateUser, currencyController.createCurrency);
router.put('/currencies/:id', authenticateUser, currencyController.updateCurrency);
router.delete('/currencies/:id', authenticateUser, currencyController.deleteCurrency);
router.get('/convert', authenticateUser, currencyController.convert);

// Tax Rules
router.get('/tax-rules', authenticateUser, currencyController.getTaxRules);
router.post('/tax-rules', authenticateUser, currencyController.createTaxRule);
router.put('/tax-rules/:id', authenticateUser, currencyController.updateTaxRule);
router.delete('/tax-rules/:id', authenticateUser, currencyController.deleteTaxRule);
router.get('/calculate-tax', authenticateUser, currencyController.calculateTax);
router.get('/calculate-vat', authenticateUser, currencyController.calculateVAT);

export default router;
