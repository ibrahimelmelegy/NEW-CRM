// ─── Third-Party Integration Routes ──────────────────────────────────────────
// Provides API endpoints for listing, testing, and triggering third-party
// provider integrations (Stripe, SendGrid, Twilio, Salesforce, HubSpot).

import express, { Request, Response } from 'express';
import { authenticateUser } from '../middleware/authMiddleware';
import integrationManager, { ProviderName } from './integrationManager';

const router = express.Router();

// GET /api/integrations/third-party - list all providers and their status
router.get('/', authenticateUser, (_req: Request, res: Response) => {
  const integrations = integrationManager.getAvailableIntegrations();
  res.json({ success: true, body: integrations });
});

// GET /api/integrations/third-party/:provider/status - single provider status
router.get('/:provider/status', authenticateUser, (req: Request, res: Response) => {
  const provider = req.params.provider as ProviderName;
  const status = integrationManager.getIntegrationStatus(provider);
  if (!status) {
    return res.status(404).json({ success: false, message: `Unknown provider: ${provider}` });
  }
  res.json({ success: true, body: status });
});

// POST /api/integrations/third-party/:provider/test - test connection
router.post('/:provider/test', authenticateUser, async (req: Request, res: Response) => {
  const provider = req.params.provider as ProviderName;
  const result = await integrationManager.testConnection(provider);
  const statusCode = result.reachable ? 200 : 422;
  res.status(statusCode).json({ success: result.reachable, body: result });
});

// POST /api/integrations/third-party/:provider/sync - trigger a sync
router.post('/:provider/sync', authenticateUser, async (req: Request, res: Response) => {
  const provider = req.params.provider as ProviderName;
  const status = integrationManager.getIntegrationStatus(provider);
  if (!status) {
    return res.status(404).json({ success: false, message: `Unknown provider: ${provider}` });
  }
  if (!status.enabled) {
    return res.status(400).json({ success: false, message: `${status.label} integration is currently disabled.` });
  }
  // Return acknowledgement; actual sync logic would be queued via a job system
  res.json({ success: true, message: `Sync triggered for ${status.label}`, body: { provider, triggeredAt: new Date().toISOString() } });
});

// POST /api/integrations/third-party/:provider/enable
router.post('/:provider/enable', authenticateUser, (req: Request, res: Response) => {
  const ok = integrationManager.enableIntegration(req.params.provider as ProviderName);
  if (!ok) return res.status(404).json({ success: false, message: 'Unknown provider' });
  res.json({ success: true, message: `${req.params.provider} enabled` });
});

// POST /api/integrations/third-party/:provider/disable
router.post('/:provider/disable', authenticateUser, (req: Request, res: Response) => {
  const ok = integrationManager.disableIntegration(req.params.provider as ProviderName);
  if (!ok) return res.status(404).json({ success: false, message: 'Unknown provider' });
  res.json({ success: true, message: `${req.params.provider} disabled` });
});

export default router;
