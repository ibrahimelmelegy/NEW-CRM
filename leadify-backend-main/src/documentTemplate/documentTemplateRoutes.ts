import express from 'express';
import documentTemplateController from './documentTemplateController';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/validation';
import { CreateTemplateDto } from './dto/createTemplateDto';
import { UpdateTemplateDto } from './dto/updateTemplateDto';
import { DocumentTemplatePermissionsEnum } from '../role/roleEnum';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Document Template
 *   description: Invoice and purchase order template management
 */

/**
 * @swagger
 * /api/document-templates:
 *   post:
 *     summary: Create a new document template
 *     tags: [Document Template]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *               - layout
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 255
 *               type:
 *                 type: string
 *                 enum: [INVOICE, PURCHASE_ORDER]
 *               layout:
 *                 type: object
 *               headerConfig:
 *                 type: object
 *               footerConfig:
 *                 type: object
 *               tableConfig:
 *                 type: object
 *               isDefault:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Template created
 */
router.post(
  '/',
  authenticateUser,
  HasPermission([DocumentTemplatePermissionsEnum.CREATE_DOCUMENT_TEMPLATES]),
  validateBody(CreateTemplateDto),
  documentTemplateController.createTemplate
);

/**
 * @swagger
 * /api/document-templates/{id}:
 *   put:
 *     summary: Update a document template
 *     tags: [Document Template]
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
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 255
 *               type:
 *                 type: string
 *                 enum: [INVOICE, PURCHASE_ORDER]
 *               layout:
 *                 type: object
 *               headerConfig:
 *                 type: object
 *               footerConfig:
 *                 type: object
 *               tableConfig:
 *                 type: object
 *               isDefault:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Template updated
 */
router.put(
  '/:id',
  authenticateUser,
  HasPermission([DocumentTemplatePermissionsEnum.EDIT_DOCUMENT_TEMPLATES]),
  validateBody(UpdateTemplateDto),
  documentTemplateController.updateTemplate
);

/**
 * @swagger
 * /api/document-templates:
 *   get:
 *     summary: Get all document templates with filtering
 *     tags: [Document Template]
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
 *         name: type
 *         schema:
 *           type: string
 *           enum: [INVOICE, PURCHASE_ORDER]
 *       - in: query
 *         name: searchKey
 *         schema:
 *           type: string
 *         description: Search templates by name
 *     responses:
 *       200:
 *         description: Paginated list of templates
 */
router.get('/', authenticateUser, HasPermission([DocumentTemplatePermissionsEnum.VIEW_DOCUMENT_TEMPLATES]), documentTemplateController.getTemplates);

/**
 * @swagger
 * /api/document-templates/default-configs:
 *   get:
 *     summary: Get default template configurations
 *     tags: [Document Template]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of default template configs
 */
router.get(
  '/default-configs',
  authenticateUser,
  HasPermission([DocumentTemplatePermissionsEnum.VIEW_DOCUMENT_TEMPLATES]),
  documentTemplateController.getDefaultConfigs
);

/**
 * @swagger
 * /api/document-templates/{id}:
 *   get:
 *     summary: Get a document template by ID
 *     tags: [Document Template]
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
 *         description: Template details
 */
router.get(
  '/:id',
  authenticateUser,
  HasPermission([DocumentTemplatePermissionsEnum.VIEW_DOCUMENT_TEMPLATES]),
  documentTemplateController.getTemplateById
);

/**
 * @swagger
 * /api/document-templates/{id}:
 *   delete:
 *     summary: Delete a document template
 *     tags: [Document Template]
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
 *         description: Template deleted
 */
router.delete(
  '/:id',
  authenticateUser,
  HasPermission([DocumentTemplatePermissionsEnum.DELETE_DOCUMENT_TEMPLATES]),
  documentTemplateController.deleteTemplate
);

/**
 * @swagger
 * /api/document-templates/{id}/clone:
 *   post:
 *     summary: Clone an existing template
 *     tags: [Document Template]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Template cloned
 */
router.post(
  '/:id/clone',
  authenticateUser,
  HasPermission([DocumentTemplatePermissionsEnum.CREATE_DOCUMENT_TEMPLATES]),
  documentTemplateController.cloneTemplate
);

/**
 * @swagger
 * /api/document-templates/seed-defaults:
 *   post:
 *     summary: Seed default template configurations
 *     tags: [Document Template]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Default templates seeded
 */
router.post(
  '/seed-defaults',
  authenticateUser,
  HasPermission([DocumentTemplatePermissionsEnum.CREATE_DOCUMENT_TEMPLATES]),
  documentTemplateController.seedDefaults
);

export default router;
