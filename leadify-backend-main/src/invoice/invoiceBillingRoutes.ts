import express from 'express';
import invoiceBillingController from './invoiceBillingController';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { InvoicePermissionsEnum } from '../role/roleEnum';

/**
 * @swagger
 * tags:
 *   name: Invoice Billing
 *   description: Full invoice lifecycle - create, line items, credit notes, aging
 */

const router = express.Router();

/**
 * @swagger
 * /api/invoices/billing/aging-report:
 *   get:
 *     summary: Get aging report
 *     description: Returns outstanding invoices grouped by age buckets (current, 30, 60, 90+ days) with per-client breakdown
 *     tags: [Invoice Billing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Aging report with buckets and client breakdown
 *       500:
 *         description: Server error
 */
// Aging report (must be before /:id to avoid route conflict)
router.get(
  '/aging-report',
  authenticateUser,
  HasPermission([InvoicePermissionsEnum.VIEW_AGING, InvoicePermissionsEnum.VIEW_INVOICES]),
  invoiceBillingController.getAgingReport
);

/**
 * @swagger
 * /api/invoices/billing/create:
 *   post:
 *     summary: Create invoice with line items
 *     tags: [Invoice Billing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - dealId
 *             properties:
 *               dealId:
 *                 type: string
 *                 format: uuid
 *                 description: Associated deal ID
 *               invoiceDate:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *               paymentTerms:
 *                 type: string
 *               dueDate:
 *                 type: string
 *                 format: date
 *               lineItems:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                       format: uuid
 *                     description:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                       default: 1
 *                     unitPrice:
 *                       type: number
 *                       default: 0
 *                     taxRate:
 *                       type: number
 *                       default: 0
 *                     discountRate:
 *                       type: number
 *                       default: 0
 *     responses:
 *       201:
 *         description: Invoice created with line items and totals
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
// Create invoice with line items
router.post('/create', authenticateUser, HasPermission([InvoicePermissionsEnum.CREATE_INVOICES]), invoiceBillingController.createInvoice);

/**
 * @swagger
 * /api/invoices/billing/from-order/{orderId}:
 *   post:
 *     summary: Create invoice from sales order
 *     description: Automatically creates an invoice with line items copied from a sales order
 *     tags: [Invoice Billing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Sales order ID
 *     responses:
 *       201:
 *         description: Invoice created from sales order
 *       404:
 *         description: Sales order not found
 *       500:
 *         description: Server error
 */
// Create invoice from sales order
router.post(
  '/from-order/:orderId',
  authenticateUser,
  HasPermission([InvoicePermissionsEnum.CREATE_INVOICES]),
  invoiceBillingController.createFromOrder
);

/**
 * @swagger
 * /api/invoices/billing/{id}:
 *   get:
 *     summary: Get invoice detail
 *     description: Returns invoice with line items, credit notes, and computed totals
 *     tags: [Invoice Billing]
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
 *         description: Invoice detail with line items and totals
 *       404:
 *         description: Invoice not found
 *       500:
 *         description: Server error
 */
// List all invoices (root GET handler)
router.get('/', authenticateUser, HasPermission([InvoicePermissionsEnum.VIEW_INVOICES]), invoiceBillingController.listInvoices);

// Get invoice detail with line items
router.get('/:id', authenticateUser, HasPermission([InvoicePermissionsEnum.VIEW_INVOICES]), invoiceBillingController.getInvoiceDetail);

/**
 * @swagger
 * /api/invoices/billing/{id}:
 *   put:
 *     summary: Update invoice
 *     description: Update invoice fields and replace line items. Cannot update collected invoices.
 *     tags: [Invoice Billing]
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
 *               invoiceDate:
 *                 type: string
 *                 format: date
 *               dealId:
 *                 type: string
 *                 format: uuid
 *               lineItems:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     description:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     unitPrice:
 *                       type: number
 *                     taxRate:
 *                       type: number
 *                     discountRate:
 *                       type: number
 *     responses:
 *       200:
 *         description: Invoice updated
 *       400:
 *         description: Cannot update collected invoice
 *       404:
 *         description: Invoice not found
 *       500:
 *         description: Server error
 */
// Update invoice
router.put('/:id', authenticateUser, HasPermission([InvoicePermissionsEnum.EDIT_INVOICES]), invoiceBillingController.updateInvoice);

/**
 * @swagger
 * /api/invoices/billing/{id}/send:
 *   patch:
 *     summary: Mark invoice as sent
 *     tags: [Invoice Billing]
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
 *         description: Invoice marked as sent
 *       404:
 *         description: Invoice not found
 *       500:
 *         description: Server error
 */
// Mark sent
router.patch('/:id/send', authenticateUser, HasPermission([InvoicePermissionsEnum.SEND_INVOICES]), invoiceBillingController.markSent);

/**
 * @swagger
 * /api/invoices/billing/{id}/void:
 *   patch:
 *     summary: Void an invoice
 *     description: Voids the invoice and zeroes the amount. Cannot void collected invoices.
 *     tags: [Invoice Billing]
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
 *         description: Invoice voided
 *       400:
 *         description: Cannot void collected invoice
 *       404:
 *         description: Invoice not found
 *       500:
 *         description: Server error
 */
// Void invoice
router.patch('/:id/void', authenticateUser, HasPermission([InvoicePermissionsEnum.VOID_INVOICES]), invoiceBillingController.voidInvoice);

/**
 * @swagger
 * /api/invoices/billing/{id}/credit-note:
 *   post:
 *     summary: Issue credit note
 *     description: Create a credit note against an invoice. Amount must be positive and not exceed invoice amount.
 *     tags: [Invoice Billing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Credit amount (must be > 0 and <= invoice amount)
 *                 example: 500
 *               reason:
 *                 type: string
 *                 example: Product return
 *               date:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Credit note created
 *       400:
 *         description: Invalid amount
 *       404:
 *         description: Invoice not found
 *       500:
 *         description: Server error
 */
// Issue credit note
router.post(
  '/:id/credit-note',
  authenticateUser,
  HasPermission([InvoicePermissionsEnum.CREATE_CREDIT_NOTE]),
  invoiceBillingController.createCreditNote
);

export default router;
