import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { wrapResult } from '../utils/response/responseWrapper';
import integrationHubService from './integrationHubService';
import { IntegrationType } from './models/integrationConfigModel';

class IntegrationHubController {
  /**
   * GET /api/integrations/hub/catalog
   * Returns the full catalog of available integrations.
   */
  public async getCatalog(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const catalog = integrationHubService.getAvailableIntegrations();
      wrapResult(res, catalog);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/integrations/hub/configured
   * Returns all configured integrations for the current tenant.
   */
  public async getConfigured(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string | undefined;
      const configured = await integrationHubService.getConfiguredIntegrations(tenantId);
      wrapResult(res, configured);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/integrations/hub/configure
   * Configure a new integration or update an existing one.
   * Body: { type: IntegrationType, config: { ... } }
   */
  public async configure(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { type, config } = req.body;

      if (!type || !config) {
        res.status(400).json({ success: false, message: 'type and config are required' });
        return;
      }

      if (!Object.values(IntegrationType).includes(type)) {
        res.status(400).json({ success: false, message: `Invalid integration type: ${type}` });
        return;
      }

      const tenantId = req.headers['x-tenant-id'] as string | undefined;
      const userId = req.user?.id;

      const result = await integrationHubService.configureIntegration(type, config, userId, tenantId);
      wrapResult(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/integrations/hub/:type/test
   * Test connection for an integration type.
   * Body: { ...config fields }
   */
  public async testConnection(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const type = req.params.type as IntegrationType;
      const config = req.body;

      if (!Object.values(IntegrationType).includes(type)) {
        res.status(400).json({ success: false, message: `Invalid integration type: ${type}` });
        return;
      }

      const result = await integrationHubService.testConnection(type, config);

      if (result.success) {
        wrapResult(res, result);
      } else {
        res.status(400).json({ success: false, message: result.message });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/integrations/hub/:id
   * Deactivate / remove an integration.
   */
  public async remove(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string | undefined;
      await integrationHubService.removeIntegration(req.params.id as string, tenantId);
      wrapResult(res, { removed: true });
    } catch (error) {
      next(error);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Outgoing Webhooks
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * GET /api/integrations/hub/webhooks
   */
  public async getWebhooks(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string | undefined;
      const webhooks = await integrationHubService.getWebhooks(tenantId);
      wrapResult(res, webhooks);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/integrations/hub/webhooks
   */
  public async createWebhook(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, url, events } = req.body;

      if (!name || !url || !events || !Array.isArray(events)) {
        res.status(400).json({ success: false, message: 'name, url, and events (array) are required' });
        return;
      }

      const tenantId = req.headers['x-tenant-id'] as string | undefined;
      const userId = req.user?.id;

      const webhook = await integrationHubService.createWebhook(req.body, userId, tenantId);
      wrapResult(res, webhook, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/integrations/hub/webhooks/:id
   */
  public async updateWebhook(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string | undefined;
      const webhook = await integrationHubService.updateWebhook(req.params.id as string, req.body, tenantId);
      wrapResult(res, webhook);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/integrations/hub/webhooks/:id
   */
  public async deleteWebhook(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string | undefined;
      await integrationHubService.deleteWebhook(req.params.id as string, tenantId);
      wrapResult(res, { deleted: true });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/integrations/hub/webhooks/:id/test
   */
  public async testWebhook(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await integrationHubService.testWebhook(req.params.id as string);
      if (result.success) {
        wrapResult(res, result);
      } else {
        res.status(400).json({ success: false, message: result.message });
      }
    } catch (error) {
      next(error);
    }
  }
}

export default new IntegrationHubController();
