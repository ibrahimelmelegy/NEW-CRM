import express from 'express';
import customFieldController from './customFieldController';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { SettingsPermissionsEnum } from '../role/roleEnum';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Custom Field
 *   description: Custom field definitions and values for CRM entities
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CustomField:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         entityType:
 *           type: string
 *           enum: [LEAD, DEAL, OPPORTUNITY, CLIENT, CONTACT, INVOICE]
 *         fieldName:
 *           type: string
 *           description: Machine name (snake_case)
 *         fieldLabel:
 *           type: string
 *           description: Display label
 *         fieldType:
 *           type: string
 *           enum: [TEXT, NUMBER, DATE, SELECT, MULTISELECT, CHECKBOX, TEXTAREA, EMAIL, PHONE, URL, CURRENCY]
 *         options:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               value:
 *                 type: string
 *               label:
 *                 type: string
 *           nullable: true
 *         defaultValue:
 *           type: string
 *           nullable: true
 *         isRequired:
 *           type: boolean
 *           default: false
 *         sortOrder:
 *           type: integer
 *           default: 0
 *         isActive:
 *           type: boolean
 *           default: true
 *         validationRules:
 *           type: object
 *           nullable: true
 *           properties:
 *             min:
 *               type: number
 *             max:
 *               type: number
 *             minLength:
 *               type: integer
 *             maxLength:
 *               type: integer
 *             pattern:
 *               type: string
 *     CustomFieldValue:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         customFieldId:
 *           type: string
 *           format: uuid
 *         entityType:
 *           type: string
 *         entityId:
 *           type: string
 *         value:
 *           type: string
 *           nullable: true
 */

router.get('/', authenticateUser, (_req, res) => res.json({ docs: [], message: 'Use specific sub-endpoints' }));

// ─── Field Definition Routes ─────────────────────────────────────────────────

/**
 * @swagger
 * /api/custom-fields/fields/{entityType}:
 *   get:
 *     summary: Get all custom field definitions for an entity type
 *     tags: [Custom Field]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [LEAD, DEAL, OPPORTUNITY, CLIENT, CONTACT, INVOICE]
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *         description: Include inactive fields (admin only)
 *     responses:
 *       200:
 *         description: List of custom field definitions
 */
router.get('/fields/:entityType', authenticateUser, customFieldController.getFields);

/**
 * @swagger
 * /api/custom-fields/fields/detail/{id}:
 *   get:
 *     summary: Get a single custom field definition
 *     tags: [Custom Field]
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
 *         description: Custom field definition
 */
router.get('/fields/detail/:id', authenticateUser, customFieldController.getFieldById);

/**
 * @swagger
 * /api/custom-fields/fields:
 *   post:
 *     summary: Create a new custom field definition
 *     tags: [Custom Field]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fieldName
 *               - fieldLabel
 *               - fieldType
 *               - entityType
 *             properties:
 *               fieldName:
 *                 type: string
 *               fieldLabel:
 *                 type: string
 *               fieldType:
 *                 type: string
 *                 enum: [TEXT, NUMBER, DATE, SELECT, MULTISELECT, CHECKBOX, TEXTAREA, EMAIL, PHONE, URL, CURRENCY]
 *               entityType:
 *                 type: string
 *                 enum: [LEAD, DEAL, OPPORTUNITY, CLIENT, CONTACT, INVOICE]
 *               options:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     value:
 *                       type: string
 *                     label:
 *                       type: string
 *               defaultValue:
 *                 type: string
 *               isRequired:
 *                 type: boolean
 *               validationRules:
 *                 type: object
 *     responses:
 *       201:
 *         description: Custom field created
 */
router.post('/fields', authenticateUser, HasPermission([SettingsPermissionsEnum.EDIT_SETTINGS]), customFieldController.createField);

/**
 * @swagger
 * /api/custom-fields/fields/{id}:
 *   put:
 *     summary: Update an existing custom field definition
 *     tags: [Custom Field]
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
 *             $ref: '#/components/schemas/CustomField'
 *     responses:
 *       200:
 *         description: Custom field updated
 */
router.put('/fields/:id', authenticateUser, HasPermission([SettingsPermissionsEnum.EDIT_SETTINGS]), customFieldController.updateField);

/**
 * @swagger
 * /api/custom-fields/fields/{id}:
 *   delete:
 *     summary: Soft-delete a custom field (set isActive=false)
 *     tags: [Custom Field]
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
 *         description: Custom field deactivated
 */
router.delete('/fields/:id', authenticateUser, HasPermission([SettingsPermissionsEnum.EDIT_SETTINGS]), customFieldController.deleteField);

/**
 * @swagger
 * /api/custom-fields/fields/reorder:
 *   put:
 *     summary: Reorder custom fields by updating sort order
 *     tags: [Custom Field]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fields
 *             properties:
 *               fields:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     sortOrder:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Fields reordered
 */
router.put('/fields/reorder', authenticateUser, HasPermission([SettingsPermissionsEnum.EDIT_SETTINGS]), customFieldController.reorderFields);

// ─── Field Value Routes ──────────────────────────────────────────────────────

/**
 * @swagger
 * /api/custom-fields/values/{entityType}/{entityId}:
 *   get:
 *     summary: Get custom field values for a specific entity
 *     tags: [Custom Field]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: entityId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Custom field values with field definitions
 */
router.get('/values/:entityType/:entityId', authenticateUser, customFieldController.getValues);

/**
 * @swagger
 * /api/custom-fields/values/{entityType}/{entityId}:
 *   put:
 *     summary: Bulk save custom field values for a specific entity
 *     tags: [Custom Field]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: entityId
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
 *               - values
 *             properties:
 *               values:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     customFieldId:
 *                       type: string
 *                     value:
 *                       type: string
 *                       nullable: true
 *     responses:
 *       200:
 *         description: Custom field values saved
 */
router.put('/values/:entityType/:entityId', authenticateUser, customFieldController.saveValues);

/**
 * @swagger
 * /api/custom-fields/values/{entityType}/{entityId}:
 *   delete:
 *     summary: Delete all custom field values for a specific entity
 *     tags: [Custom Field]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: entityId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Custom field values deleted
 */
router.delete('/values/:entityType/:entityId', authenticateUser, customFieldController.deleteValues);

export default router;
