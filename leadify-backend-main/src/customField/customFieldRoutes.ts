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
 *         fieldName:
 *           type: string
 *         fieldLabel:
 *           type: string
 *         fieldType:
 *           type: string
 *           enum: [TEXT, NUMBER, DATE, SELECT, CHECKBOX, TEXTAREA]
 *         entityType:
 *           type: string
 *           enum: [LEAD, DEAL, OPPORTUNITY, CLIENT]
 *         options:
 *           type: array
 *           items:
 *             type: string
 *           nullable: true
 *         required:
 *           type: boolean
 *           default: false
 *         sortOrder:
 *           type: integer
 *           default: 0
 *     CustomFieldValue:
 *       type: object
 *       properties:
 *         customFieldId:
 *           type: string
 *           format: uuid
 *         value:
 *           oneOf:
 *             - type: string
 *             - type: number
 *             - type: boolean
 */

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
 *           enum: [LEAD, DEAL, OPPORTUNITY, CLIENT]
 *         description: The entity type to get fields for
 *     responses:
 *       200:
 *         description: List of custom field definitions
 */
router.get('/fields/:entityType', authenticateUser, customFieldController.getFields);

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
 *                 description: Internal field name
 *               fieldLabel:
 *                 type: string
 *                 description: Display label for the field
 *               fieldType:
 *                 type: string
 *                 enum: [TEXT, NUMBER, DATE, SELECT, CHECKBOX, TEXTAREA]
 *               entityType:
 *                 type: string
 *                 enum: [LEAD, DEAL, OPPORTUNITY, CLIENT]
 *               options:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Options for SELECT field type
 *               required:
 *                 type: boolean
 *                 default: false
 *               sortOrder:
 *                 type: integer
 *                 default: 0
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
 *         description: Custom field ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fieldName:
 *                 type: string
 *               fieldLabel:
 *                 type: string
 *               fieldType:
 *                 type: string
 *                 enum: [TEXT, NUMBER, DATE, SELECT, CHECKBOX, TEXTAREA]
 *               options:
 *                 type: array
 *                 items:
 *                   type: string
 *               required:
 *                 type: boolean
 *               sortOrder:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Custom field updated
 */
router.put('/fields/:id', authenticateUser, HasPermission([SettingsPermissionsEnum.EDIT_SETTINGS]), customFieldController.updateField);

/**
 * @swagger
 * /api/custom-fields/fields/{id}:
 *   delete:
 *     summary: Delete a custom field definition and its values
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
 *         description: Custom field ID
 *     responses:
 *       200:
 *         description: Custom field deleted
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
 *                   required:
 *                     - id
 *                     - sortOrder
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     sortOrder:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Fields reordered
 */
router.put('/fields/reorder', authenticateUser, HasPermission([SettingsPermissionsEnum.EDIT_SETTINGS]), customFieldController.reorderFields);

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
 *           enum: [LEAD, DEAL, OPPORTUNITY, CLIENT]
 *         description: The entity type
 *       - in: path
 *         name: entityId
 *         required: true
 *         schema:
 *           type: string
 *         description: The entity ID
 *     responses:
 *       200:
 *         description: List of custom field values with field definitions
 */
router.get('/values/:entityType/:entityId', authenticateUser, customFieldController.getValues);

/**
 * @swagger
 * /api/custom-fields/values/{entityType}/{entityId}:
 *   put:
 *     summary: Save custom field values for a specific entity
 *     tags: [Custom Field]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [LEAD, DEAL, OPPORTUNITY, CLIENT]
 *         description: The entity type
 *       - in: path
 *         name: entityId
 *         required: true
 *         schema:
 *           type: string
 *         description: The entity ID
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
 *                   required:
 *                     - customFieldId
 *                     - value
 *                   properties:
 *                     customFieldId:
 *                       type: string
 *                       format: uuid
 *                     value:
 *                       oneOf:
 *                         - type: string
 *                         - type: number
 *                         - type: boolean
 *     responses:
 *       200:
 *         description: Custom field values saved
 */
router.put('/values/:entityType/:entityId', authenticateUser, customFieldController.saveValues);

export default router;
