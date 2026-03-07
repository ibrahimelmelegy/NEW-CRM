import { Router } from 'express';
import ProcurementController from './procurementController';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { ProcurementPermissionsEnum } from '../role/roleEnum';

/**
 * @swagger
 * tags:
 *   name: Procurement
 *   description: Purchase order management — create, approve, reject, track
 */

const router = Router();

/**
 * @swagger
 * /api/procurement:
 *   post:
 *     summary: Create a purchase order
 *     tags: [Procurement]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - poNumber
 *               - vendorId
 *               - paymentMethod
 *             properties:
 *               poNumber:
 *                 type: string
 *               vendorId:
 *                 type: integer
 *               projectId:
 *                 type: string
 *                 format: uuid
 *               status:
 *                 type: string
 *                 enum: [Draft, Pending, Approved, Rejected, Archived]
 *                 default: Draft
 *               paymentMethod:
 *                 type: string
 *                 enum: [Cash, Credit]
 *               dueDate:
 *                 type: string
 *                 format: date
 *               paymentTerms:
 *                 type: string
 *               totalAmount:
 *                 type: number
 *               attachments:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - description
 *                     - quantity
 *                     - unitPrice
 *                   properties:
 *                     description:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *                     unitPrice:
 *                       type: number
 *                     tax:
 *                       type: number
 *                       default: 0
 *     responses:
 *       201:
 *         description: Purchase order created
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/', authenticateUser, HasPermission([ProcurementPermissionsEnum.CREATE_PROCUREMENT]), ProcurementController.createPurchaseOrder);

/**
 * @swagger
 * /api/procurement/stats:
 *   get:
 *     summary: Get procurement dashboard stats
 *     description: Returns summary statistics for purchase orders
 *     tags: [Procurement]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *       500:
 *         description: Server error
 */
router.get('/stats', authenticateUser, HasPermission([ProcurementPermissionsEnum.VIEW_PROCUREMENT]), ProcurementController.getDashboardStats);

/**
 * @swagger
 * /api/procurement/vendor-comparison:
 *   get:
 *     summary: Get vendor comparison
 *     description: Compare vendors by PO history, spend, fulfillment rate, and rejection rate
 *     tags: [Procurement]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vendor comparison data
 *       500:
 *         description: Server error
 */
router.get(
  '/vendor-comparison',
  authenticateUser,
  HasPermission([ProcurementPermissionsEnum.VIEW_PROCUREMENT]),
  ProcurementController.getVendorComparison
);

/**
 * @swagger
 * /api/procurement:
 *   get:
 *     summary: List purchase orders
 *     tags: [Procurement]
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
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Draft, Pending, Approved, Rejected, Archived]
 *       - in: query
 *         name: vendorId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Paginated list of purchase orders with vendor and items
 *       500:
 *         description: Server error
 */
router.get('/', authenticateUser, HasPermission([ProcurementPermissionsEnum.VIEW_PROCUREMENT]), ProcurementController.getPurchaseOrders);

/**
 * @swagger
 * /api/procurement/{id}:
 *   get:
 *     summary: Get purchase order by ID
 *     tags: [Procurement]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Purchase order details with vendor, items, and creator
 *       404:
 *         description: Purchase order not found
 *       500:
 *         description: Server error
 */
router.get('/:id(\\d+)', authenticateUser, HasPermission([ProcurementPermissionsEnum.VIEW_PROCUREMENT]), ProcurementController.getPOById);

/**
 * @swagger
 * /api/procurement/{id}/approve:
 *   patch:
 *     summary: Approve a purchase order
 *     tags: [Procurement]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Purchase order approved
 *       404:
 *         description: Purchase order not found
 *       500:
 *         description: Server error
 */
router.patch('/:id/approve', authenticateUser, HasPermission([ProcurementPermissionsEnum.APPROVE_PROCUREMENT]), ProcurementController.approvePO);

/**
 * @swagger
 * /api/procurement/{id}/reject:
 *   patch:
 *     summary: Reject a purchase order
 *     tags: [Procurement]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rejectionReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Purchase order rejected
 *       404:
 *         description: Purchase order not found
 *       500:
 *         description: Server error
 */
router.patch('/:id/reject', authenticateUser, HasPermission([ProcurementPermissionsEnum.REJECT_PROCUREMENT]), ProcurementController.rejectPO);

/**
 * @swagger
 * /api/procurement/{id}/receive:
 *   patch:
 *     summary: Receive a purchase order
 *     description: Marks an approved PO as received and records item variances
 *     tags: [Procurement]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               receivedItems:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     itemId:
 *                       type: integer
 *                     receivedQuantity:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Purchase order received
 *       400:
 *         description: PO not in correct status
 *       404:
 *         description: Purchase order not found
 *       500:
 *         description: Server error
 */
router.patch('/:id/receive', authenticateUser, HasPermission([ProcurementPermissionsEnum.APPROVE_PROCUREMENT]), ProcurementController.receivePO);

/**
 * @swagger
 * /api/procurement/{id}:
 *   delete:
 *     summary: Delete a purchase order
 *     tags: [Procurement]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Purchase order deleted
 *       404:
 *         description: Purchase order not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', authenticateUser, HasPermission([ProcurementPermissionsEnum.DELETE_PROCUREMENT]), ProcurementController.deletePurchaseOrder);

export default router;
