import express from 'express';
import erpnextController from './erpnextController';
import { authenticateUser } from '../../middleware/authMiddleware';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: ERPNext
 *   description: ERPNext integration - sync data between CRM and ERPNext
 */

// ---- Connection ----

/**
 * @swagger
 * /api/integrations/erpnext/status:
 *   get:
 *     summary: Get ERPNext connection status
 *     tags: [ERPNext]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Connection status retrieved
 */
router.get('/status', authenticateUser, erpnextController.getStatus);

/**
 * @swagger
 * /api/integrations/erpnext/test-connection:
 *   post:
 *     summary: Test ERPNext connection (resets client)
 *     tags: [ERPNext]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Connection test result
 */
router.post('/test-connection', authenticateUser, erpnextController.testConnection);

// ---- Push syncs (CRM -> ERPNext) ----

/**
 * @swagger
 * /api/integrations/erpnext/sync/invoice/{id}:
 *   post:
 *     summary: Sync an invoice to ERPNext
 *     tags: [ERPNext]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Invoice ID
 *     responses:
 *       200:
 *         description: Invoice synced successfully
 *       400:
 *         description: Invalid invoice ID
 *       422:
 *         description: Sync failed
 */
router.post('/sync/invoice/:id', authenticateUser, erpnextController.syncInvoice);

/**
 * @swagger
 * /api/integrations/erpnext/sync/client/{id}:
 *   post:
 *     summary: Sync a client to ERPNext
 *     tags: [ERPNext]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Client ID
 *     responses:
 *       200:
 *         description: Client synced successfully
 *       400:
 *         description: Invalid client ID
 *       422:
 *         description: Sync failed
 */
router.post('/sync/client/:id', authenticateUser, erpnextController.syncClient);

/**
 * @swagger
 * /api/integrations/erpnext/sync/vendor/{id}:
 *   post:
 *     summary: Sync a vendor to ERPNext
 *     tags: [ERPNext]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Vendor ID
 *     responses:
 *       200:
 *         description: Vendor synced successfully
 *       400:
 *         description: Invalid vendor ID
 *       422:
 *         description: Sync failed
 */
router.post('/sync/vendor/:id', authenticateUser, erpnextController.syncVendor);

/**
 * @swagger
 * /api/integrations/erpnext/sync/po/{id}:
 *   post:
 *     summary: Sync a purchase order to ERPNext
 *     tags: [ERPNext]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Purchase order ID
 *     responses:
 *       200:
 *         description: Purchase order synced successfully
 *       400:
 *         description: Invalid purchase order ID
 *       422:
 *         description: Sync failed
 */
router.post('/sync/po/:id', authenticateUser, erpnextController.syncPurchaseOrder);

// ---- Pull from ERPNext ----

/**
 * @swagger
 * /api/integrations/erpnext/accounts:
 *   get:
 *     summary: Pull chart of accounts from ERPNext
 *     tags: [ERPNext]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Chart of accounts retrieved
 */
router.get('/accounts', authenticateUser, erpnextController.getAccounts);

/**
 * @swagger
 * /api/integrations/erpnext/balances:
 *   get:
 *     summary: Pull account balances from ERPNext
 *     tags: [ERPNext]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account balances retrieved
 */
router.get('/balances', authenticateUser, erpnextController.getBalances);

/**
 * @swagger
 * /api/integrations/erpnext/profit-loss:
 *   get:
 *     summary: Pull profit and loss report from ERPNext
 *     tags: [ERPNext]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: to
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Profit and loss report retrieved
 *       400:
 *         description: Missing required query parameters
 */
router.get('/profit-loss', authenticateUser, erpnextController.getProfitLoss);

/**
 * @swagger
 * /api/integrations/erpnext/balance-sheet:
 *   get:
 *     summary: Pull balance sheet from ERPNext
 *     tags: [ERPNext]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Balance sheet date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Balance sheet retrieved
 *       400:
 *         description: Missing required query parameter
 */
router.get('/balance-sheet', authenticateUser, erpnextController.getBalanceSheet);

/**
 * @swagger
 * /api/integrations/erpnext/payments:
 *   get:
 *     summary: Pull payment entries from ERPNext
 *     tags: [ERPNext]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: party_type
 *         schema:
 *           type: string
 *         description: Party type filter (e.g. Customer, Supplier)
 *       - in: query
 *         name: party
 *         schema:
 *           type: string
 *         description: Party name filter
 *       - in: query
 *         name: payment_type
 *         schema:
 *           type: string
 *         description: Payment type filter (e.g. Receive, Pay)
 *       - in: query
 *         name: from_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter payments from this date (YYYY-MM-DD)
 *       - in: query
 *         name: to_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter payments up to this date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Payment entries retrieved
 */
router.get('/payments', authenticateUser, erpnextController.getPayments);

// ---- Sync Logs ----

/**
 * @swagger
 * /api/integrations/erpnext/sync-logs:
 *   get:
 *     summary: Get ERPNext sync logs
 *     tags: [ERPNext]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: string
 *         description: Filter by entity type (e.g. invoice, client, vendor)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by sync status
 *       - in: query
 *         name: direction
 *         schema:
 *           type: string
 *         description: Filter by sync direction (push or pull)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of logs to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Number of logs to skip
 *     responses:
 *       200:
 *         description: Sync logs retrieved
 */
router.get('/sync-logs', authenticateUser, erpnextController.getSyncLogs);

export default router;
