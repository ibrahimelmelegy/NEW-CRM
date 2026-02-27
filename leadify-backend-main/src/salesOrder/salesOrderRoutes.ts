import { Router } from 'express';
import SalesOrderController from './salesOrderController';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { SalesOrderPermissionsEnum } from '../role/roleEnum';

/**
 * @swagger
 * tags:
 *   name: Sales Order
 *   description: Sales order lifecycle — create, update, status transitions, fulfillment tracking
 */

const router = Router();

// ─── IMPORTANT: Named routes MUST come before parameterized /:id routes ─────

/**
 * @swagger
 * /api/sales-orders/analytics:
 *   get:
 *     summary: Get order analytics
 *     description: Returns aggregated order statistics — total revenue, avg order value, status breakdown, revenue by day/month
 *     tags: [Sales Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Order analytics data
 */
// Order analytics (MUST be before /:id)
router.get('/analytics', authenticateUser, HasPermission([SalesOrderPermissionsEnum.VIEW_SALES_ORDERS]), SalesOrderController.getOrderAnalytics);

/**
 * @swagger
 * /api/sales-orders/client/{clientId}:
 *   get:
 *     summary: Get orders for a specific client
 *     description: Returns paginated orders history for a client
 *     tags: [Sales Order]
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
 *         description: Paginated client order history
 */
// Get client orders (MUST be before /:id)
router.get(
  '/client/:clientId',
  authenticateUser,
  HasPermission([SalesOrderPermissionsEnum.VIEW_SALES_ORDERS]),
  SalesOrderController.getClientOrders
);

/**
 * @swagger
 * /api/sales-orders:
 *   post:
 *     summary: Create a new sales order
 *     description: Creates a sales order with line items. Generates a sequential order number (SO-0001, etc.) and calculates totals automatically.
 *     tags: [Sales Order]
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
 *               - items
 *             properties:
 *               clientId:
 *                 type: string
 *                 format: uuid
 *               dealId:
 *                 type: string
 *                 format: uuid
 *               currency:
 *                 type: string
 *                 default: SAR
 *               paymentTerms:
 *                 type: string
 *               paymentStatus:
 *                 type: string
 *                 enum: [PENDING, PAID, PARTIAL, REFUNDED]
 *                 default: PENDING
 *               shippingAddress:
 *                 type: string
 *               notes:
 *                 type: string
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - description
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
 *         description: Sales order created with line items and computed totals
 *       400:
 *         description: Validation error (e.g. no items provided)
 *       500:
 *         description: Server error
 */
// Create a new sales order
router.post('/', authenticateUser, HasPermission([SalesOrderPermissionsEnum.CREATE_SALES_ORDERS]), SalesOrderController.createOrder);

/**
 * @swagger
 * /api/sales-orders/from-deal/{dealId}:
 *   post:
 *     summary: Convert deal to sales order
 *     description: Automatically creates a sales order from an existing deal, copying relevant details
 *     tags: [Sales Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dealId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Deal ID to convert
 *     responses:
 *       201:
 *         description: Sales order created from deal
 *       404:
 *         description: Deal not found
 *       500:
 *         description: Server error
 */
// Convert deal to sales order
router.post(
  '/from-deal/:dealId',
  authenticateUser,
  HasPermission([SalesOrderPermissionsEnum.CONVERT_DEAL_TO_ORDER]),
  SalesOrderController.convertDealToOrder
);

/**
 * @swagger
 * /api/sales-orders/from-cart:
 *   post:
 *     summary: Convert a cart to a sales order
 *     description: Creates a sales order from cart items
 *     tags: [Sales Order]
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
 *               - items
 *             properties:
 *               clientId:
 *                 type: string
 *                 format: uuid
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *               currency:
 *                 type: string
 *               shippingAddress:
 *                 type: string
 *               notes:
 *                 type: string
 *               couponDiscount:
 *                 type: number
 *     responses:
 *       201:
 *         description: Sales order created from cart
 */
// Convert cart to sales order
router.post(
  '/from-cart',
  authenticateUser,
  HasPermission([SalesOrderPermissionsEnum.CREATE_SALES_ORDERS]),
  SalesOrderController.convertCartToOrder
);

/**
 * @swagger
 * /api/sales-orders:
 *   get:
 *     summary: List sales orders
 *     description: Returns paginated sales orders with optional filters by status, client, date range, and search by order number
 *     tags: [Sales Order]
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
 *         name: searchKey
 *         schema:
 *           type: string
 *         description: Search by order number or notes
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED]
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *           enum: [PENDING, PAID, PARTIAL, REFUNDED]
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
 *         description: Paginated list of sales orders with client info
 *       500:
 *         description: Server error
 */
// List all sales orders with pagination/filters
router.get('/', authenticateUser, HasPermission([SalesOrderPermissionsEnum.VIEW_SALES_ORDERS]), SalesOrderController.getOrders);

// ─── Parameterized /:id routes below ────────────────────────────────────────

/**
 * @swagger
 * /api/sales-orders/{id}:
 *   get:
 *     summary: Get sales order by ID
 *     description: Returns sales order with line items, fulfillments, and client info
 *     tags: [Sales Order]
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
 *         description: Sales order detail with line items and fulfillments
 *       404:
 *         description: Sales order not found
 *       500:
 *         description: Server error
 */
// Get a single sales order by ID
router.get('/:id', authenticateUser, HasPermission([SalesOrderPermissionsEnum.VIEW_SALES_ORDERS]), SalesOrderController.getOrderById);

/**
 * @swagger
 * /api/sales-orders/{id}:
 *   put:
 *     summary: Update a sales order
 *     description: Update sales order fields and replace line items
 *     tags: [Sales Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               clientId:
 *                 type: string
 *                 format: uuid
 *               dealId:
 *                 type: string
 *                 format: uuid
 *               currency:
 *                 type: string
 *               paymentTerms:
 *                 type: string
 *               paymentStatus:
 *                 type: string
 *                 enum: [PENDING, PAID, PARTIAL, REFUNDED]
 *               shippingAddress:
 *                 type: string
 *               notes:
 *                 type: string
 *               items:
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
 *                     unitPrice:
 *                       type: number
 *                     taxRate:
 *                       type: number
 *                     discountRate:
 *                       type: number
 *     responses:
 *       200:
 *         description: Sales order updated
 *       404:
 *         description: Sales order not found
 *       500:
 *         description: Server error
 */
// Update a sales order
router.put('/:id', authenticateUser, HasPermission([SalesOrderPermissionsEnum.EDIT_SALES_ORDERS]), SalesOrderController.updateOrder);

/**
 * @swagger
 * /api/sales-orders/{id}/status:
 *   patch:
 *     summary: Update order status
 *     description: Transition order to a new status (draft -> confirmed -> processing -> shipped -> delivered, or cancelled)
 *     tags: [Sales Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [DRAFT, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED]
 *     responses:
 *       200:
 *         description: Order status updated
 *       404:
 *         description: Sales order not found
 *       500:
 *         description: Server error
 */
// Update order status
router.patch('/:id/status', authenticateUser, HasPermission([SalesOrderPermissionsEnum.EDIT_SALES_ORDERS]), SalesOrderController.updateStatus);

/**
 * @swagger
 * /api/sales-orders/{id}/payment-status:
 *   patch:
 *     summary: Update payment status
 *     description: Update the payment status of a sales order (PENDING, PAID, PARTIAL, REFUNDED)
 *     tags: [Sales Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentStatus
 *             properties:
 *               paymentStatus:
 *                 type: string
 *                 enum: [PENDING, PAID, PARTIAL, REFUNDED]
 *     responses:
 *       200:
 *         description: Payment status updated
 *       404:
 *         description: Sales order not found
 *       500:
 *         description: Server error
 */
// Update payment status
router.patch('/:id/payment-status', authenticateUser, HasPermission([SalesOrderPermissionsEnum.EDIT_SALES_ORDERS]), SalesOrderController.updatePaymentStatus);

/**
 * @swagger
 * /api/sales-orders/{id}/fulfillment:
 *   post:
 *     summary: Add fulfillment to an order
 *     description: Create a fulfillment record for shipping/delivery tracking
 *     tags: [Sales Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, PACKED, SHIPPED, DELIVERED]
 *                 default: PENDING
 *               trackingNumber:
 *                 type: string
 *               carrier:
 *                 type: string
 *               shippedDate:
 *                 type: string
 *                 format: date
 *               deliveredDate:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Fulfillment record created
 *       404:
 *         description: Sales order not found
 *       500:
 *         description: Server error
 */
// Add fulfillment to an order
router.post('/:id/fulfillment', authenticateUser, HasPermission([SalesOrderPermissionsEnum.EDIT_SALES_ORDERS]), SalesOrderController.addFulfillment);

/**
 * @swagger
 * /api/sales-orders/{id}/fulfillment/{fid}:
 *   patch:
 *     summary: Update a fulfillment record
 *     description: Update tracking info, status, or dates on an existing fulfillment
 *     tags: [Sales Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Sales order ID
 *       - in: path
 *         name: fid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Fulfillment ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, PACKED, SHIPPED, DELIVERED]
 *               trackingNumber:
 *                 type: string
 *               carrier:
 *                 type: string
 *               shippedDate:
 *                 type: string
 *                 format: date
 *               deliveredDate:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Fulfillment updated
 *       404:
 *         description: Fulfillment or sales order not found
 *       500:
 *         description: Server error
 */
// Update a fulfillment record
router.patch(
  '/:id/fulfillment/:fid',
  authenticateUser,
  HasPermission([SalesOrderPermissionsEnum.EDIT_SALES_ORDERS]),
  SalesOrderController.updateFulfillment
);

/**
 * @swagger
 * /api/sales-orders/{id}:
 *   delete:
 *     summary: Delete a sales order
 *     description: Permanently deletes a sales order and all associated items and fulfillments
 *     tags: [Sales Order]
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
 *         description: Sales order deleted
 *       404:
 *         description: Sales order not found
 *       500:
 *         description: Server error
 */
// Delete a sales order
router.delete('/:id', authenticateUser, HasPermission([SalesOrderPermissionsEnum.EDIT_SALES_ORDERS]), SalesOrderController.deleteOrder);

export default router;
