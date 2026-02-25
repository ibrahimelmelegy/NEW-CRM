import express from 'express';
import paymentController from './paymentController';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { PaymentPermissionsEnum } from '../role/roleEnum';

const router = express.Router();

// ** --------------------- POST --------------------- **/

/**
 * @swagger
 * /api/payments/:
 *   post:
 *     summary: Record a new payment
 *     description: Record a payment against a client/invoice. Requires authentication.
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - clientId
 *               - amount
 *               - date
 *               - method
 *             properties:
 *               invoiceId:
 *                 type: integer
 *                 description: Optional invoice ID to link payment
 *               clientId:
 *                 type: string
 *                 format: uuid
 *               amount:
 *                 type: number
 *                 format: decimal
 *               date:
 *                 type: string
 *                 format: date
 *               method:
 *                 type: string
 *                 enum: [CASH, BANK_TRANSFER, CREDIT_CARD, CHECK, ONLINE]
 *               reference:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Payment recorded successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.post('/', authenticateUser, HasPermission([PaymentPermissionsEnum.RECORD_PAYMENTS]), paymentController.recordPayment);

/**
 * @swagger
 * /api/payments/remind/{invoiceId}:
 *   post:
 *     summary: Send a payment reminder for an invoice
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invoiceId
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
 *               - type
 *               - method
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [FIRST, SECOND, FINAL]
 *               method:
 *                 type: string
 *                 enum: [EMAIL, SMS]
 *     responses:
 *       201:
 *         description: Reminder sent
 *       404:
 *         description: Invoice not found
 */
router.post('/remind/:invoiceId', authenticateUser, HasPermission([PaymentPermissionsEnum.SEND_PAYMENT_REMINDERS]), paymentController.sendReminder);

// ** --------------------- GET --------------------- **/

/**
 * @swagger
 * /api/payments/dashboard:
 *   get:
 *     summary: Get collection dashboard data
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data with KPIs and top debtors
 */
router.get('/dashboard', authenticateUser, HasPermission([PaymentPermissionsEnum.VIEW_PAYMENT_DASHBOARD]), paymentController.getCollectionDashboard);

/**
 * @swagger
 * /api/payments/:
 *   get:
 *     summary: List all payments
 *     tags: [Payment]
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
 *           default: 10
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: string
 *       - in: query
 *         name: method
 *         schema:
 *           type: string
 *           enum: [CASH, BANK_TRANSFER, CREDIT_CARD, CHECK, ONLINE]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [COMPLETED, PENDING, FAILED, VOIDED]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Paginated list of payments
 */
router.get('/', authenticateUser, HasPermission([PaymentPermissionsEnum.VIEW_PAYMENTS]), paymentController.getPayments);

/**
 * @swagger
 * /api/payments/client/{clientId}:
 *   get:
 *     summary: Get payment history for a client
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Client payment history with summary
 */
router.get('/client/:clientId', authenticateUser, HasPermission([PaymentPermissionsEnum.VIEW_PAYMENTS]), paymentController.getClientPaymentHistory);

/**
 * @swagger
 * /api/payments/{id}:
 *   get:
 *     summary: Get payment details by ID
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Payment details
 *       654:
 *         description: Payment not found
 */
router.get('/:id', authenticateUser, HasPermission([PaymentPermissionsEnum.VIEW_PAYMENTS]), paymentController.getPaymentById);

// ** --------------------- PATCH --------------------- **/

/**
 * @swagger
 * /api/payments/{id}/void:
 *   patch:
 *     summary: Void a payment
 *     description: Marks a payment as voided and reverses invoice collection if applicable
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Payment voided
 *       654:
 *         description: Payment not found
 */
router.patch('/:id/void', authenticateUser, HasPermission([PaymentPermissionsEnum.VOID_PAYMENTS]), paymentController.voidPayment);

export default router;
