import express from 'express';
import integrationController from './integrationController';
import hubController from './integrationHubController';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { IntegrationPermissionsEnum } from '../role/roleEnum';

const router = express.Router();

// ─── Existing integration routes ─────────────────────────────────────────────
router.get('/', authenticateUser, integrationController.getIntegrations);
router.post('/', authenticateUser, integrationController.upsertIntegration);
router.delete('/:id', authenticateUser, integrationController.deleteIntegration);

// OAuth Callbacks
router.get('/google/callback', integrationController.handleGoogleCallback);
router.get('/outlook/callback', integrationController.handleOutlookCallback);
router.post('/google/auth-url', authenticateUser, integrationController.getGoogleAuthUrl);

// ─── Integration Hub: static routes first ────────────────────────────────────
router.get('/hub/catalog', authenticateUser, hubController.getCatalog);
router.get('/hub/configured', authenticateUser, hubController.getConfigured);
router.post(
  '/hub/configure',
  authenticateUser,
  HasPermission([IntegrationPermissionsEnum.CONFIGURE_INTEGRATIONS]),
  hubController.configure
);

// ─── Outgoing Webhooks (before wildcard hub routes) ──────────────────────────
router.get('/hub/webhooks', authenticateUser, hubController.getWebhooks);
router.post(
  '/hub/webhooks',
  authenticateUser,
  HasPermission([IntegrationPermissionsEnum.MANAGE_WEBHOOKS]),
  hubController.createWebhook
);
router.put(
  '/hub/webhooks/:id',
  authenticateUser,
  HasPermission([IntegrationPermissionsEnum.MANAGE_WEBHOOKS]),
  hubController.updateWebhook
);
router.delete(
  '/hub/webhooks/:id',
  authenticateUser,
  HasPermission([IntegrationPermissionsEnum.MANAGE_WEBHOOKS]),
  hubController.deleteWebhook
);
router.post('/hub/webhooks/:id/test', authenticateUser, hubController.testWebhook);

// ─── Integration Hub: wildcard routes last ───────────────────────────────────
router.post('/hub/:type/test', authenticateUser, hubController.testConnection);
router.delete(
  '/hub/:id',
  authenticateUser,
  HasPermission([IntegrationPermissionsEnum.CONFIGURE_INTEGRATIONS]),
  hubController.remove
);

export default router;
