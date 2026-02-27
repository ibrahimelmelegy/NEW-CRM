import express from 'express';
import invoiceController from './invoiceController';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { DealPermissionsEnum } from '../role/roleEnum';

/**
 * @swagger
 * tags:
 *   name: Invoice
 *   description: Invoice management (legacy collection tracking)
 */

const router = express.Router();

/**
 * @swagger
 * /api/invoices:
 *   get:
 *     summary: List invoices
 *     description: Get paginated list of invoices with optional filters
 *     tags: [Invoice]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [collected, pending]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by invoice number
 *     responses:
 *       200:
 *         description: Paginated invoice list
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/invoices/summary:
 *   get:
 *     summary: Get invoice summary
 *     description: Returns total, collected, and pending amounts and counts
 *     tags: [Invoice]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Invoice summary statistics
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/invoices/{id}:
 *   get:
 *     summary: Get invoice by ID
 *     tags: [Invoice]
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
 *         description: Invoice details with deal info
 *       404:
 *         description: Invoice not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/invoices/{id}/collect:
 *   put:
 *     summary: Mark invoice as collected
 *     tags: [Invoice]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               collectedDate:
 *                 type: string
 *                 format: date
 *                 description: Collection date (defaults to today)
 *     responses:
 *       200:
 *         description: Invoice marked as collected
 *       404:
 *         description: Invoice not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/invoices/{id}/uncollect:
 *   put:
 *     summary: Mark invoice as uncollected
 *     tags: [Invoice]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Invoice marked as uncollected
 *       404:
 *         description: Invoice not found
 *       500:
 *         description: Server error
 */

router.get('/', authenticateUser, invoiceController.getInvoices);
router.get('/summary', authenticateUser, invoiceController.getSummary);
router.get('/aging-report', authenticateUser, invoiceController.getAgingReport);
router.get('/revenue-summary', authenticateUser, invoiceController.getRevenueSummary);
router.get('/overdue', authenticateUser, invoiceController.getOverdueInvoices);
router.post('/calculate-totals', authenticateUser, invoiceController.calculateTotals);
router.get('/:id', authenticateUser, invoiceController.getInvoiceById);
router.put('/:id/collect', authenticateUser, HasPermission([DealPermissionsEnum.EDIT_DEALS]), invoiceController.markCollected);
router.put('/:id/uncollect', authenticateUser, HasPermission([DealPermissionsEnum.EDIT_DEALS]), invoiceController.markUncollected);

export default router;
