import express from 'express';
import erpnextController from './erpnextController';
import { authenticateUser } from '../../middleware/authMiddleware';

const router = express.Router();

// ---- Connection ----
router.get('/status', authenticateUser, erpnextController.getStatus);
router.post('/test-connection', authenticateUser, erpnextController.testConnection);

// ---- Push syncs (CRM -> ERPNext) ----
router.post('/sync/invoice/:id', authenticateUser, erpnextController.syncInvoice);
router.post('/sync/client/:id', authenticateUser, erpnextController.syncClient);
router.post('/sync/vendor/:id', authenticateUser, erpnextController.syncVendor);
router.post('/sync/po/:id', authenticateUser, erpnextController.syncPurchaseOrder);

// ---- Pull from ERPNext ----
router.get('/accounts', authenticateUser, erpnextController.getAccounts);
router.get('/balances', authenticateUser, erpnextController.getBalances);
router.get('/profit-loss', authenticateUser, erpnextController.getProfitLoss);
router.get('/balance-sheet', authenticateUser, erpnextController.getBalanceSheet);
router.get('/payments', authenticateUser, erpnextController.getPayments);

// ---- Sync Logs ----
router.get('/sync-logs', authenticateUser, erpnextController.getSyncLogs);

export default router;
