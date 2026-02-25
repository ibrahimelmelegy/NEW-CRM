import express from 'express';
import integrationController from './integrationController';
import hubController from './integrationHubController';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { IntegrationPermissionsEnum } from '../role/roleEnum';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Integration
 *   description: Third-party integrations, OAuth connections, integration hub, and outgoing webhooks
 */

// ─── Existing integration routes ─────────────────────────────────────────────

/**
 * @swagger
 * /api/integrations:
 *   get:
 *     summary: Get all configured integrations
 *     tags: [Integration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of integrations
 */
router.get('/', authenticateUser, integrationController.getIntegrations);

/**
 * @swagger
 * /api/integrations:
 *   post:
 *     summary: Create or update an integration
 *     tags: [Integration]
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
 *             properties:
 *               provider:
 *                 type: string
 *                 description: Integration provider name (e.g. google, outlook)
 *               config:
 *                 type: object
 *                 description: Provider-specific configuration object
 *               systemWide:
 *                 type: boolean
 *                 description: If true and user is SUPER_ADMIN, creates a system-wide integration
 *     responses:
 *       200:
 *         description: Integration created or updated
 */
router.post('/', authenticateUser, integrationController.upsertIntegration);

/**
 * @swagger
 * /api/integrations/{id}:
 *   delete:
 *     summary: Delete an integration
 *     tags: [Integration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Integration ID
 *     responses:
 *       200:
 *         description: Integration deleted
 */
router.delete('/:id', authenticateUser, integrationController.deleteIntegration);

// OAuth Callbacks

/**
 * @swagger
 * /api/integrations/google/callback:
 *   get:
 *     summary: Google OAuth callback (redirects to frontend)
 *     tags: [Integration]
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: OAuth authorization code from Google
 *     responses:
 *       302:
 *         description: Redirects to frontend with OAuth status
 */
router.get('/google/callback', integrationController.handleGoogleCallback);

/**
 * @swagger
 * /api/integrations/outlook/callback:
 *   get:
 *     summary: Outlook OAuth callback (redirects to frontend)
 *     tags: [Integration]
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: OAuth authorization code from Outlook
 *     responses:
 *       302:
 *         description: Redirects to frontend with OAuth status
 */
router.get('/outlook/callback', integrationController.handleOutlookCallback);

/**
 * @swagger
 * /api/integrations/google/auth-url:
 *   post:
 *     summary: Generate a Google OAuth authorization URL
 *     tags: [Integration]
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
 *               - clientSecret
 *               - redirectUri
 *             properties:
 *               clientId:
 *                 type: string
 *               clientSecret:
 *                 type: string
 *               redirectUri:
 *                 type: string
 *     responses:
 *       200:
 *         description: Google authorization URL
 */
router.post('/google/auth-url', authenticateUser, integrationController.getGoogleAuthUrl);

// ─── Integration Hub: static routes first ────────────────────────────────────

/**
 * @swagger
 * /api/integrations/hub/catalog:
 *   get:
 *     summary: Get the full catalog of available integrations
 *     tags: [Integration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Catalog of available integrations
 */
router.get('/hub/catalog', authenticateUser, hubController.getCatalog);

/**
 * @swagger
 * /api/integrations/hub/configured:
 *   get:
 *     summary: Get all configured integrations for the current tenant
 *     tags: [Integration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of configured integrations
 */
router.get('/hub/configured', authenticateUser, hubController.getConfigured);

/**
 * @swagger
 * /api/integrations/hub/configure:
 *   post:
 *     summary: Configure a new integration or update an existing one
 *     tags: [Integration]
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
 *               - config
 *             properties:
 *               type:
 *                 type: string
 *                 description: Integration type (e.g. slack, jira, hubspot)
 *               config:
 *                 type: object
 *                 description: Integration-specific configuration
 *     responses:
 *       201:
 *         description: Integration configured
 *       400:
 *         description: Missing type/config or invalid integration type
 */
router.post('/hub/configure', authenticateUser, HasPermission([IntegrationPermissionsEnum.CONFIGURE_INTEGRATIONS]), hubController.configure);

// ─── Outgoing Webhooks (before wildcard hub routes) ──────────────────────────

/**
 * @swagger
 * /api/integrations/hub/webhooks:
 *   get:
 *     summary: Get all outgoing webhooks
 *     tags: [Integration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of outgoing webhooks
 */
router.get('/hub/webhooks', authenticateUser, hubController.getWebhooks);

/**
 * @swagger
 * /api/integrations/hub/webhooks:
 *   post:
 *     summary: Create a new outgoing webhook
 *     tags: [Integration]
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
 *               - url
 *               - events
 *             properties:
 *               name:
 *                 type: string
 *                 description: Webhook name
 *               url:
 *                 type: string
 *                 format: uri
 *                 description: Target URL for the webhook
 *               events:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Event types to subscribe to
 *               secret:
 *                 type: string
 *                 description: Webhook signing secret (auto-generated if omitted)
 *               headers:
 *                 type: object
 *                 description: Custom HTTP headers to include with webhook requests
 *     responses:
 *       201:
 *         description: Webhook created
 *       400:
 *         description: Missing required fields
 */
router.post('/hub/webhooks', authenticateUser, HasPermission([IntegrationPermissionsEnum.MANAGE_WEBHOOKS]), hubController.createWebhook);

/**
 * @swagger
 * /api/integrations/hub/webhooks/{id}:
 *   put:
 *     summary: Update an outgoing webhook
 *     tags: [Integration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Webhook ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               url:
 *                 type: string
 *                 format: uri
 *               events:
 *                 type: array
 *                 items:
 *                   type: string
 *               headers:
 *                 type: object
 *               status:
 *                 type: string
 *                 description: Webhook status (e.g. ACTIVE, INACTIVE)
 *     responses:
 *       200:
 *         description: Webhook updated
 *       404:
 *         description: Webhook not found
 */
router.put('/hub/webhooks/:id', authenticateUser, HasPermission([IntegrationPermissionsEnum.MANAGE_WEBHOOKS]), hubController.updateWebhook);

/**
 * @swagger
 * /api/integrations/hub/webhooks/{id}:
 *   delete:
 *     summary: Delete an outgoing webhook
 *     tags: [Integration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Webhook ID
 *     responses:
 *       200:
 *         description: Webhook deleted
 *       404:
 *         description: Webhook not found
 */
router.delete('/hub/webhooks/:id', authenticateUser, HasPermission([IntegrationPermissionsEnum.MANAGE_WEBHOOKS]), hubController.deleteWebhook);

/**
 * @swagger
 * /api/integrations/hub/webhooks/{id}/test:
 *   post:
 *     summary: Send a test payload to a webhook
 *     tags: [Integration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Webhook ID
 *     responses:
 *       200:
 *         description: Test payload sent successfully
 *       400:
 *         description: Webhook test failed
 */
router.post('/hub/webhooks/:id/test', authenticateUser, hubController.testWebhook);

// ─── Integration Hub: wildcard routes last ───────────────────────────────────

/**
 * @swagger
 * /api/integrations/hub/{type}/test:
 *   post:
 *     summary: Test connection for an integration type
 *     tags: [Integration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *         description: Integration type (e.g. slack, jira, hubspot)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Integration-specific configuration fields to test
 *     responses:
 *       200:
 *         description: Connection test successful
 *       400:
 *         description: Connection test failed or invalid integration type
 */
router.post('/hub/:type/test', authenticateUser, hubController.testConnection);

/**
 * @swagger
 * /api/integrations/hub/{id}:
 *   delete:
 *     summary: Remove a configured integration
 *     tags: [Integration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Integration configuration ID
 *     responses:
 *       200:
 *         description: Integration removed
 */
router.delete('/hub/:id', authenticateUser, HasPermission([IntegrationPermissionsEnum.CONFIGURE_INTEGRATIONS]), hubController.remove);

export default router;
