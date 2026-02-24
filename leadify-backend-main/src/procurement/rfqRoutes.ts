import { Router } from 'express';
import RFQController from './rfqController';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { ProcurementPermissionsEnum } from '../role/roleEnum';

/**
 * @swagger
 * tags:
 *   name: RFQ
 *   description: Request for Quotation — create, send to vendors, collect responses
 */

const router = Router();

/**
 * @swagger
 * /api/rfq:
 *   post:
 *     summary: Create an RFQ
 *     tags: [RFQ]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rfqNumber
 *               - title
 *               - deadLine
 *             properties:
 *               rfqNumber:
 *                 type: string
 *               title:
 *                 type: string
 *               projectId:
 *                 type: string
 *                 format: uuid
 *               deadLine:
 *                 type: string
 *                 format: date
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                   properties:
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *                       default: 1
 *                     uom:
 *                       type: string
 *                       default: PCS
 *     responses:
 *       201:
 *         description: RFQ created
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/', authenticateUser, HasPermission([ProcurementPermissionsEnum.CREATE_PROCUREMENT]), RFQController.createRFQ);

/**
 * @swagger
 * /api/rfq:
 *   get:
 *     summary: List RFQs
 *     tags: [RFQ]
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
 *           enum: [Draft, Sent, Partially Received, Completed, Converted to PO, Archived]
 *     responses:
 *       200:
 *         description: Paginated list of RFQs with items and vendors
 *       500:
 *         description: Server error
 */
router.get('/', authenticateUser, HasPermission([ProcurementPermissionsEnum.VIEW_PROCUREMENT]), RFQController.getAllRFQs);

/**
 * @swagger
 * /api/rfq/{id}:
 *   get:
 *     summary: Get RFQ by ID
 *     tags: [RFQ]
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
 *         description: RFQ details with items, vendors, and vendor responses
 *       404:
 *         description: RFQ not found
 *       500:
 *         description: Server error
 */
router.get('/:id', authenticateUser, HasPermission([ProcurementPermissionsEnum.VIEW_PROCUREMENT]), RFQController.getRFQById);

/**
 * @swagger
 * /api/rfq/{id}/send:
 *   post:
 *     summary: Send RFQ to vendors
 *     description: Sends the RFQ to the specified vendors for quotation
 *     tags: [RFQ]
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
 *               - vendorIds
 *             properties:
 *               vendorIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of vendor IDs to send the RFQ to
 *     responses:
 *       200:
 *         description: RFQ sent to vendors
 *       404:
 *         description: RFQ not found
 *       500:
 *         description: Server error
 */
router.post('/:id/send', authenticateUser, HasPermission([ProcurementPermissionsEnum.CREATE_PROCUREMENT]), RFQController.sendRFQ);

/**
 * @swagger
 * /api/rfq/{id}/vendors/{vendorId}/response:
 *   post:
 *     summary: Add vendor response to RFQ
 *     description: Records a vendor's quotation response for each RFQ item
 *     tags: [RFQ]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: RFQ ID
 *       - in: path
 *         name: vendorId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Vendor ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               totalOfferAmount:
 *                 type: number
 *               notes:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     rfqItemId:
 *                       type: string
 *                       format: uuid
 *                     price:
 *                       type: number
 *                     remarks:
 *                       type: string
 *     responses:
 *       200:
 *         description: Vendor response recorded
 *       404:
 *         description: RFQ or vendor not found
 *       500:
 *         description: Server error
 */
router.post('/:id/vendors/:vendorId/response', authenticateUser, HasPermission([ProcurementPermissionsEnum.CREATE_PROCUREMENT]), RFQController.addVendorResponse);

export default router;
