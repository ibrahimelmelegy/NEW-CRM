import { Router } from 'express';
import emailController from './emailController';
import emailTemplateController from './emailTemplateController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Email Integration
 *   description: Email accounts, messages, tracking, and composer templates
 */

// Account routes

/**
 * @swagger
 * /api/email/accounts:
 *   get:
 *     summary: Get all connected email accounts
 *     tags: [Email Integration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of email accounts
 */
router.get('/', authenticateUser, emailController.getAccounts);
router.get('/accounts', authenticateUser, emailController.getAccounts);

/**
 * @swagger
 * /api/email/accounts:
 *   post:
 *     summary: Connect a new email account
 *     tags: [Email Integration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - provider
 *               - email
 *             properties:
 *               provider:
 *                 type: string
 *                 description: Email provider (gmail, outlook, imap, smtp)
 *               email:
 *                 type: string
 *                 description: Email address
 *               accessToken:
 *                 type: string
 *                 description: OAuth access token
 *               refreshToken:
 *                 type: string
 *                 description: OAuth refresh token
 *               settings:
 *                 type: object
 *                 description: IMAP/SMTP configuration settings
 *     responses:
 *       201:
 *         description: Account connected successfully
 */
router.post('/accounts', authenticateUser, emailController.connectAccount);

/**
 * @swagger
 * /api/email/accounts/{id}:
 *   delete:
 *     summary: Disconnect an email account
 *     tags: [Email Integration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Email account ID
 *     responses:
 *       200:
 *         description: Account disconnected successfully
 */
router.delete('/accounts/:id', authenticateUser, emailController.disconnectAccount);

// Message routes

/**
 * @swagger
 * /api/email/messages:
 *   get:
 *     summary: Get email messages for an account
 *     tags: [Email Integration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *         description: Email account ID
 *       - in: query
 *         name: folder
 *         schema:
 *           type: string
 *         description: Email folder (e.g. inbox, sent)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Paginated list of email messages
 */
router.get('/messages', authenticateUser, emailController.getMessages);

/**
 * @swagger
 * /api/email/messages/send:
 *   post:
 *     summary: Send an email
 *     tags: [Email Integration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountId
 *               - to
 *               - subject
 *               - body
 *             properties:
 *               accountId:
 *                 type: string
 *                 description: Email account ID to send from
 *               to:
 *                 type: string
 *                 description: Recipient email address
 *               cc:
 *                 type: string
 *                 description: CC email address
 *               subject:
 *                 type: string
 *                 description: Email subject
 *               body:
 *                 type: string
 *                 description: Email body (HTML)
 *               entityType:
 *                 type: string
 *                 description: Related entity type (e.g. lead, deal)
 *               entityId:
 *                 type: string
 *                 description: Related entity ID
 *     responses:
 *       201:
 *         description: Email sent successfully
 */
router.post('/messages/send', authenticateUser, emailController.sendEmail);

// Tracking routes

/**
 * @swagger
 * /api/email/tracking/{messageId}:
 *   get:
 *     summary: Get tracking events for a message
 *     tags: [Email Integration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Email message ID
 *     responses:
 *       200:
 *         description: List of tracking events
 */
router.get('/tracking/:messageId', authenticateUser, emailController.getTracking);

// Email Composer Templates

/**
 * @swagger
 * /api/email/templates:
 *   get:
 *     summary: Get all email composer templates
 *     tags: [Email Integration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of email templates
 */
router.get('/templates', authenticateUser, emailTemplateController.getTemplates);

/**
 * @swagger
 * /api/email/templates/{id}:
 *   get:
 *     summary: Get an email template by ID
 *     tags: [Email Integration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Template ID
 *     responses:
 *       200:
 *         description: Email template details
 */
router.get('/templates/:id', authenticateUser, emailTemplateController.getTemplate);

/**
 * @swagger
 * /api/email/templates:
 *   post:
 *     summary: Create a new email template
 *     tags: [Email Integration]
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
 *               - subject
 *               - body
 *             properties:
 *               name:
 *                 type: string
 *                 description: Template name
 *               subject:
 *                 type: string
 *                 description: Email subject line
 *               body:
 *                 type: string
 *                 description: Email body (HTML)
 *               category:
 *                 type: string
 *                 description: Template category (follow-up, introduction, proposal, thank-you, win-back)
 *               variables:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Template variable names (e.g. firstName, dealName)
 *               isDefault:
 *                 type: boolean
 *                 description: Whether this is a default template
 *     responses:
 *       201:
 *         description: Template created successfully
 */
router.post('/templates', authenticateUser, emailTemplateController.createTemplate);

/**
 * @swagger
 * /api/email/templates/{id}:
 *   put:
 *     summary: Update an email template
 *     tags: [Email Integration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Template ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Template name
 *               subject:
 *                 type: string
 *                 description: Email subject line
 *               body:
 *                 type: string
 *                 description: Email body (HTML)
 *               category:
 *                 type: string
 *                 description: Template category
 *               variables:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Template variable names
 *               isDefault:
 *                 type: boolean
 *                 description: Whether this is a default template
 *     responses:
 *       200:
 *         description: Template updated successfully
 */
router.put('/templates/:id', authenticateUser, emailTemplateController.updateTemplate);

/**
 * @swagger
 * /api/email/templates/{id}:
 *   delete:
 *     summary: Delete an email template
 *     tags: [Email Integration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Template ID
 *     responses:
 *       200:
 *         description: Template deleted successfully
 */
router.delete('/templates/:id', authenticateUser, emailTemplateController.deleteTemplate);

export default router;
