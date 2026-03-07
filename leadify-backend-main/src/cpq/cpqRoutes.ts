import express from 'express';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { CpqPermissionsEnum } from '../role/roleEnum';
import controller from './cpqController';

const router = express.Router();

router.get('/', authenticateUser, HasPermission([CpqPermissionsEnum.VIEW_CPQ]), controller.getQuotes);

// ─── Quote Calculation & Validation (no persistence) ────────────────────────
router.post('/generate-quote', authenticateUser, HasPermission([CpqPermissionsEnum.VIEW_CPQ]), controller.generateQuote);
router.post('/validate-pricing', authenticateUser, HasPermission([CpqPermissionsEnum.VIEW_CPQ]), controller.validatePricing);

// ─── Analytics ──────────────────────────────────────────────────────────────
router.get('/analytics', authenticateUser, HasPermission([CpqPermissionsEnum.VIEW_CPQ]), controller.getAnalytics);

// ─── Price Book CRUD ────────────────────────────────────────────────────────
router.get('/price-books', authenticateUser, HasPermission([CpqPermissionsEnum.VIEW_CPQ]), controller.getPriceBooks);
router.get('/price-books/:id', authenticateUser, HasPermission([CpqPermissionsEnum.VIEW_CPQ]), controller.getPriceBookById);
router.post('/price-books', authenticateUser, HasPermission([CpqPermissionsEnum.CREATE_CPQ]), controller.createPriceBook);
router.put('/price-books/:id', authenticateUser, HasPermission([CpqPermissionsEnum.EDIT_CPQ]), controller.updatePriceBook);
router.delete('/price-books/:id', authenticateUser, HasPermission([CpqPermissionsEnum.DELETE_CPQ]), controller.deletePriceBook);

// ─── Price Book Entries CRUD ────────────────────────────────────────────────
router.get('/entries', authenticateUser, HasPermission([CpqPermissionsEnum.VIEW_CPQ]), controller.getEntries);
router.post('/entries', authenticateUser, HasPermission([CpqPermissionsEnum.CREATE_CPQ]), controller.addEntry);
router.put('/entries/:id', authenticateUser, HasPermission([CpqPermissionsEnum.EDIT_CPQ]), controller.updateEntry);
router.delete('/entries/:id', authenticateUser, HasPermission([CpqPermissionsEnum.DELETE_CPQ]), controller.deleteEntry);

// ─── Pricing Rules CRUD ────────────────────────────────────────────────────
router.get('/pricing-rules', authenticateUser, HasPermission([CpqPermissionsEnum.VIEW_CPQ]), controller.getPricingRules);
router.post('/pricing-rules', authenticateUser, HasPermission([CpqPermissionsEnum.CREATE_CPQ]), controller.createPricingRule);
router.put('/pricing-rules/:id', authenticateUser, HasPermission([CpqPermissionsEnum.EDIT_CPQ]), controller.updatePricingRule);
router.delete('/pricing-rules/:id', authenticateUser, HasPermission([CpqPermissionsEnum.DELETE_CPQ]), controller.deletePricingRule);

// ─── Saved Quotes CRUD ─────────────────────────────────────────────────────
router.get('/quotes', authenticateUser, HasPermission([CpqPermissionsEnum.VIEW_CPQ]), controller.getQuotes);
router.get('/quotes/:id', authenticateUser, HasPermission([CpqPermissionsEnum.VIEW_CPQ]), controller.getQuoteById);
router.post('/quotes', authenticateUser, HasPermission([CpqPermissionsEnum.CREATE_CPQ]), controller.createQuote);
router.put('/quotes/:id', authenticateUser, HasPermission([CpqPermissionsEnum.EDIT_CPQ]), controller.updateQuote);
router.delete('/quotes/:id', authenticateUser, HasPermission([CpqPermissionsEnum.DELETE_CPQ]), controller.deleteQuote);

// ─── Quote Workflow Actions ─────────────────────────────────────────────────
router.put('/quotes/:id/approve', authenticateUser, HasPermission([CpqPermissionsEnum.EDIT_CPQ]), controller.approveQuote);
router.put('/quotes/:id/reject', authenticateUser, HasPermission([CpqPermissionsEnum.EDIT_CPQ]), controller.rejectQuote);
router.put('/quotes/:id/send', authenticateUser, HasPermission([CpqPermissionsEnum.EDIT_CPQ]), controller.sendQuote);
router.post('/quotes/:id/convert-to-deal', authenticateUser, HasPermission([CpqPermissionsEnum.CREATE_CPQ]), controller.convertQuoteToDeal);

// ─── Maintenance ────────────────────────────────────────────────────────────
router.post('/expire-overdue', authenticateUser, HasPermission([CpqPermissionsEnum.EDIT_CPQ]), controller.expireOverdueQuotes);

export default router;
