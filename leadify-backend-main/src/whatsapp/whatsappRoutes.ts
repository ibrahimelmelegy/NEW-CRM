import express from 'express';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import whatsappController from './whatsappController';
import { WhatsAppPermissionsEnum } from '../role/roleEnum';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: WhatsApp
 *   description: WhatsApp Business messaging, contacts, templates, and analytics
 */

// ═══════════════════════════════════════════════════════════════════════════
// WEBHOOK (Public - no auth)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/whatsapp/webhook:
 *   get:
 *     summary: WhatsApp Cloud API webhook verification
 *     tags: [WhatsApp]
 *     parameters:
 *       - in: query
 *         name: hub.mode
 *         schema:
 *           type: string
 *       - in: query
 *         name: hub.verify_token
 *         schema:
 *           type: string
 *       - in: query
 *         name: hub.challenge
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Webhook verified
 *       403:
 *         description: Verification failed
 */
router.get('/webhook', whatsappController.webhookVerify);

/**
 * @swagger
 * /api/whatsapp/webhook:
 *   post:
 *     summary: Receive incoming WhatsApp messages and status updates
 *     tags: [WhatsApp]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed
 */
router.post('/webhook', whatsappController.webhookIncoming);

// ═══════════════════════════════════════════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/whatsapp/analytics:
 *   get:
 *     summary: Get WhatsApp messaging analytics
 *     tags: [WhatsApp]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Analytics data
 */
router.get('/analytics', authenticateUser, HasPermission([WhatsAppPermissionsEnum.VIEW_WHATSAPP_ANALYTICS]), whatsappController.getAnalytics);

// ═══════════════════════════════════════════════════════════════════════════
// CONTACTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/whatsapp/contacts:
 *   get:
 *     summary: Get all WhatsApp contacts
 *     tags: [WhatsApp]
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
 *           default: 25
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, BLOCKED, ARCHIVED]
 *       - in: query
 *         name: tags
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *     responses:
 *       200:
 *         description: Paginated contacts list
 */
router.get('/contacts', authenticateUser, HasPermission([WhatsAppPermissionsEnum.VIEW_WHATSAPP_CONTACTS]), whatsappController.getContacts);

/**
 * @swagger
 * /api/whatsapp/contacts/import:
 *   post:
 *     summary: Import contacts from CRM clients
 *     tags: [WhatsApp]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Import results
 */
router.post(
  '/contacts/import',
  authenticateUser,
  HasPermission([WhatsAppPermissionsEnum.MANAGE_WHATSAPP_CONTACTS]),
  whatsappController.importFromClients
);

/**
 * @swagger
 * /api/whatsapp/contacts/{id}:
 *   get:
 *     summary: Get a WhatsApp contact by ID
 *     tags: [WhatsApp]
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
 *         description: Contact details
 */
router.get('/contacts/:id', authenticateUser, HasPermission([WhatsAppPermissionsEnum.VIEW_WHATSAPP_CONTACTS]), whatsappController.getContactById);

/**
 * @swagger
 * /api/whatsapp/contacts:
 *   post:
 *     summary: Create a new WhatsApp contact
 *     tags: [WhatsApp]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *             properties:
 *               phoneNumber:
 *                 type: string
 *               name:
 *                 type: string
 *               clientId:
 *                 type: string
 *                 format: uuid
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Contact created
 */
router.post('/contacts', authenticateUser, HasPermission([WhatsAppPermissionsEnum.MANAGE_WHATSAPP_CONTACTS]), whatsappController.createContact);

/**
 * @swagger
 * /api/whatsapp/contacts/{id}:
 *   put:
 *     summary: Update a WhatsApp contact
 *     tags: [WhatsApp]
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
 *               name:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, BLOCKED, ARCHIVED]
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               clientId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Contact updated
 */
router.put('/contacts/:id', authenticateUser, HasPermission([WhatsAppPermissionsEnum.MANAGE_WHATSAPP_CONTACTS]), whatsappController.updateContact);

/**
 * @swagger
 * /api/whatsapp/contacts/{id}:
 *   delete:
 *     summary: Delete a WhatsApp contact
 *     tags: [WhatsApp]
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
 *         description: Contact deleted
 */
router.delete('/contacts/:id', authenticateUser, HasPermission([WhatsAppPermissionsEnum.MANAGE_WHATSAPP_CONTACTS]), whatsappController.deleteContact);

// ═══════════════════════════════════════════════════════════════════════════
// MESSAGES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/whatsapp/messages/{contactId}:
 *   get:
 *     summary: Get messages for a contact (conversation view)
 *     tags: [WhatsApp]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contactId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Paginated messages
 */
router.get('/messages/:contactId', authenticateUser, HasPermission([WhatsAppPermissionsEnum.VIEW_WHATSAPP_MESSAGES]), whatsappController.getMessages);

/**
 * @swagger
 * /api/whatsapp/messages/send/text:
 *   post:
 *     summary: Send a text message
 *     tags: [WhatsApp]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contactId
 *               - content
 *             properties:
 *               contactId:
 *                 type: string
 *                 format: uuid
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Message sent
 */
router.post(
  '/messages/send/text',
  authenticateUser,
  HasPermission([WhatsAppPermissionsEnum.SEND_WHATSAPP_MESSAGES]),
  whatsappController.sendTextMessage
);

/**
 * @swagger
 * /api/whatsapp/messages/send/media:
 *   post:
 *     summary: Send a media message (image, document, audio, video)
 *     tags: [WhatsApp]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contactId
 *               - mediaUrl
 *             properties:
 *               contactId:
 *                 type: string
 *                 format: uuid
 *               content:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [IMAGE, DOCUMENT, AUDIO, VIDEO]
 *               mediaUrl:
 *                 type: string
 *               mediaCaption:
 *                 type: string
 *               fileName:
 *                 type: string
 *     responses:
 *       201:
 *         description: Media message sent
 */
router.post(
  '/messages/send/media',
  authenticateUser,
  HasPermission([WhatsAppPermissionsEnum.SEND_WHATSAPP_MESSAGES]),
  whatsappController.sendMediaMessage
);

/**
 * @swagger
 * /api/whatsapp/messages/send/template:
 *   post:
 *     summary: Send a template message
 *     tags: [WhatsApp]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contactId
 *               - templateId
 *             properties:
 *               contactId:
 *                 type: string
 *                 format: uuid
 *               templateId:
 *                 type: string
 *                 format: uuid
 *               variables:
 *                 type: object
 *     responses:
 *       201:
 *         description: Template message sent
 */
router.post(
  '/messages/send/template',
  authenticateUser,
  HasPermission([WhatsAppPermissionsEnum.SEND_WHATSAPP_MESSAGES]),
  whatsappController.sendTemplateMessage
);

/**
 * @swagger
 * /api/whatsapp/messages/read/{contactId}:
 *   put:
 *     summary: Mark all inbound messages from a contact as read
 *     tags: [WhatsApp]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contactId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Messages marked as read
 */
router.put(
  '/messages/read/:contactId',
  authenticateUser,
  HasPermission([WhatsAppPermissionsEnum.VIEW_WHATSAPP_MESSAGES]),
  whatsappController.markAsRead
);

/**
 * @swagger
 * /api/whatsapp/messages/bulk:
 *   post:
 *     summary: Send a template to multiple contacts
 *     tags: [WhatsApp]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contactIds
 *               - templateId
 *             properties:
 *               contactIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *               templateId:
 *                 type: string
 *                 format: uuid
 *               variables:
 *                 type: object
 *     responses:
 *       200:
 *         description: Bulk send results
 */
router.post('/messages/bulk', authenticateUser, HasPermission([WhatsAppPermissionsEnum.SEND_WHATSAPP_BULK]), whatsappController.sendBulkTemplate);

// ═══════════════════════════════════════════════════════════════════════════
// TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/whatsapp/templates:
 *   get:
 *     summary: Get all message templates
 *     tags: [WhatsApp]
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
 *           default: 25
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [MARKETING, UTILITY, AUTHENTICATION]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [APPROVED, PENDING, REJECTED]
 *     responses:
 *       200:
 *         description: Paginated templates
 */
router.get('/templates', authenticateUser, HasPermission([WhatsAppPermissionsEnum.VIEW_WHATSAPP_TEMPLATES]), whatsappController.getTemplates);

/**
 * @swagger
 * /api/whatsapp/templates/{id}:
 *   get:
 *     summary: Get a template by ID
 *     tags: [WhatsApp]
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
 *         description: Template details
 */
router.get('/templates/:id', authenticateUser, HasPermission([WhatsAppPermissionsEnum.VIEW_WHATSAPP_TEMPLATES]), whatsappController.getTemplateById);

/**
 * @swagger
 * /api/whatsapp/templates:
 *   post:
 *     summary: Create a new message template
 *     tags: [WhatsApp]
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
 *               - content
 *             properties:
 *               name:
 *                 type: string
 *               language:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [MARKETING, UTILITY, AUTHENTICATION]
 *               content:
 *                 type: string
 *               headerType:
 *                 type: string
 *                 enum: [NONE, TEXT, IMAGE, DOCUMENT]
 *               headerContent:
 *                 type: string
 *               footerText:
 *                 type: string
 *               buttons:
 *                 type: array
 *     responses:
 *       201:
 *         description: Template created
 */
router.post('/templates', authenticateUser, HasPermission([WhatsAppPermissionsEnum.MANAGE_WHATSAPP_TEMPLATES]), whatsappController.createTemplate);

/**
 * @swagger
 * /api/whatsapp/templates/{id}:
 *   put:
 *     summary: Update a message template
 *     tags: [WhatsApp]
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
 *         description: Template updated
 */
router.put('/templates/:id', authenticateUser, HasPermission([WhatsAppPermissionsEnum.MANAGE_WHATSAPP_TEMPLATES]), whatsappController.updateTemplate);

/**
 * @swagger
 * /api/whatsapp/templates/{id}:
 *   delete:
 *     summary: Delete a message template
 *     tags: [WhatsApp]
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
 *         description: Template deleted
 */
router.delete(
  '/templates/:id',
  authenticateUser,
  HasPermission([WhatsAppPermissionsEnum.MANAGE_WHATSAPP_TEMPLATES]),
  whatsappController.deleteTemplate
);

export default router;
