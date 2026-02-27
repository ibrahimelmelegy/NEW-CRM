import express from 'express';
import docBuilderController from './docBuilderController';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { validateBody, validateQuery } from '../middleware/validation';
import { CreateDocInput } from './inputs/createDocInput';
import { UpdateDocInput } from './inputs/updateDocInput';
import { GetDocsInput } from './inputs/getDocsInput';
import { ChangeStatusInput } from './inputs/changeStatusInput';
import { DocBuilderPermissionsEnum } from '../role/roleEnum';

const router = express.Router();

// ** --------------------- POST --------------------- **/

/**
 * @swagger
 * /api/doc-builder/:
 *   post:
 *     summary: Create a new document
 *     tags: [DocBuilder]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - title
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [quote, invoice, proforma_invoice, purchase_order, credit_note, contract, rfq, sales_order, delivery_note, sla]
 *               title:
 *                 type: string
 *               reference:
 *                 type: string
 *               content:
 *                 type: string
 *               clientName:
 *                 type: string
 *               clientCompany:
 *                 type: string
 *               clientEmail:
 *                 type: string
 *               subtotal:
 *                 type: number
 *               discount:
 *                 type: number
 *               tax:
 *                 type: number
 *               total:
 *                 type: number
 *               currency:
 *                 type: string
 *     responses:
 *       201:
 *         description: Document created successfully
 *       400:
 *         description: Bad request
 */
router.post(
  '/',
  authenticateUser,
  HasPermission([DocBuilderPermissionsEnum.CREATE_DOCUMENTS]),
  validateBody(CreateDocInput),
  docBuilderController.createDocument
);

/**
 * @swagger
 * /api/doc-builder/{id}/convert:
 *   post:
 *     summary: Convert document to another type
 *     tags: [DocBuilder]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - targetType
 *             properties:
 *               targetType:
 *                 type: string
 *     responses:
 *       201:
 *         description: Document converted successfully
 */
/**
 * @swagger
 * /api/doc-builder/bulk-pdf:
 *   post:
 *     summary: Generate PDFs for multiple documents
 *     tags: [DocBuilder]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ids
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Bulk PDFs generated
 */
router.post(
  '/bulk-pdf',
  authenticateUser,
  HasPermission([DocBuilderPermissionsEnum.VIEW_OWN_DOCUMENTS, DocBuilderPermissionsEnum.VIEW_GLOBAL_DOCUMENTS]),
  docBuilderController.generateBulkPdf
);

router.post('/:id/convert', authenticateUser, HasPermission([DocBuilderPermissionsEnum.CREATE_DOCUMENTS]), docBuilderController.convertDocument);

/**
 * @swagger
 * /api/doc-builder/{id}/pdf:
 *   post:
 *     summary: Generate PDF for a document
 *     tags: [DocBuilder]
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
 *         description: PDF generated successfully
 */
router.post(
  '/:id/pdf',
  authenticateUser,
  HasPermission([DocBuilderPermissionsEnum.VIEW_OWN_DOCUMENTS, DocBuilderPermissionsEnum.VIEW_GLOBAL_DOCUMENTS]),
  docBuilderController.generatePdf
);

/**
 * @swagger
 * /api/doc-builder/{id}/send:
 *   post:
 *     summary: Send document via email
 *     tags: [DocBuilder]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *               - subject
 *             properties:
 *               to:
 *                 type: string
 *               subject:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Document sent successfully
 */
router.post('/:id/send', authenticateUser, HasPermission([DocBuilderPermissionsEnum.SEND_DOCUMENTS]), docBuilderController.sendDocument);

/**
 * @swagger
 * /api/doc-builder/{id}/versions/{versionId}/restore:
 *   post:
 *     summary: Restore a previous version
 *     tags: [DocBuilder]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: versionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Version restored successfully
 */
router.post(
  '/:id/versions/:versionId/restore',
  authenticateUser,
  HasPermission([DocBuilderPermissionsEnum.EDIT_DOCUMENTS]),
  docBuilderController.restoreVersion
);

// ** --------------------- PUT --------------------- **/

/**
 * @swagger
 * /api/doc-builder/{id}/status:
 *   put:
 *     summary: Change document status
 *     tags: [DocBuilder]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status updated successfully
 */
router.put(
  '/:id/status',
  authenticateUser,
  HasPermission([DocBuilderPermissionsEnum.EDIT_DOCUMENTS]),
  validateBody(ChangeStatusInput),
  docBuilderController.changeStatus
);

/**
 * @swagger
 * /api/doc-builder/{id}:
 *   put:
 *     summary: Update a document
 *     tags: [DocBuilder]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateDocInput'
 *     responses:
 *       200:
 *         description: Document updated successfully
 */
router.put(
  '/:id',
  authenticateUser,
  HasPermission([DocBuilderPermissionsEnum.EDIT_DOCUMENTS]),
  validateBody(UpdateDocInput),
  docBuilderController.updateDocument
);

// ** --------------------- DELETE --------------------- **/

/**
 * @swagger
 * /api/doc-builder/{id}:
 *   delete:
 *     summary: Archive/delete a document
 *     tags: [DocBuilder]
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
 *         description: Document archived successfully
 */
router.delete('/:id', authenticateUser, HasPermission([DocBuilderPermissionsEnum.DELETE_DOCUMENTS]), docBuilderController.deleteDocument);

// ** --------------------- GET --------------------- **/

/**
 * @swagger
 * /api/doc-builder/brand-settings:
 *   get:
 *     summary: Get brand settings for document rendering
 *     tags: [DocBuilder]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Brand settings
 */
router.get(
  '/brand-settings',
  authenticateUser,
  HasPermission([DocBuilderPermissionsEnum.VIEW_OWN_DOCUMENTS, DocBuilderPermissionsEnum.VIEW_GLOBAL_DOCUMENTS]),
  docBuilderController.getBrandSettings
);

/**
 * @swagger
 * /api/doc-builder/stats:
 *   get:
 *     summary: Get document statistics
 *     tags: [DocBuilder]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Document statistics
 */
router.get(
  '/stats',
  authenticateUser,
  HasPermission([DocBuilderPermissionsEnum.VIEW_OWN_DOCUMENTS, DocBuilderPermissionsEnum.VIEW_GLOBAL_DOCUMENTS]),
  docBuilderController.getStats
);

/**
 * @swagger
 * /api/doc-builder/:
 *   get:
 *     summary: Get all documents with filters and pagination
 *     tags: [DocBuilder]
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
 *         name: searchKey
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Paginated list of documents
 */
router.get(
  '/',
  authenticateUser,
  HasPermission([DocBuilderPermissionsEnum.VIEW_OWN_DOCUMENTS, DocBuilderPermissionsEnum.VIEW_GLOBAL_DOCUMENTS]),
  validateQuery(GetDocsInput),
  docBuilderController.getDocuments
);

/**
 * @swagger
 * /api/doc-builder/{id}/versions:
 *   get:
 *     summary: Get all versions of a document
 *     tags: [DocBuilder]
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
 *         description: List of document versions
 */
router.get(
  '/:id/versions',
  authenticateUser,
  HasPermission([DocBuilderPermissionsEnum.VIEW_OWN_DOCUMENTS, DocBuilderPermissionsEnum.VIEW_GLOBAL_DOCUMENTS]),
  docBuilderController.getVersions
);

/**
 * @swagger
 * /api/doc-builder/{id}/versions/{versionId}:
 *   get:
 *     summary: Get a specific version
 *     tags: [DocBuilder]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: versionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Version details with content
 */
router.get(
  '/:id/versions/:versionId',
  authenticateUser,
  HasPermission([DocBuilderPermissionsEnum.VIEW_OWN_DOCUMENTS, DocBuilderPermissionsEnum.VIEW_GLOBAL_DOCUMENTS]),
  docBuilderController.getVersionById
);

/**
 * @swagger
 * /api/doc-builder/{id}:
 *   get:
 *     summary: Get a document by ID
 *     tags: [DocBuilder]
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
 *         description: Document details
 */
router.get(
  '/:id',
  authenticateUser,
  HasPermission([DocBuilderPermissionsEnum.VIEW_OWN_DOCUMENTS, DocBuilderPermissionsEnum.VIEW_GLOBAL_DOCUMENTS]),
  docBuilderController.getDocumentById
);

export default router;
