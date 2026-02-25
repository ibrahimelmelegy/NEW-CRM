import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { wrapResult } from '../utils/response/responseWrapper';
import integrationService from './integrationService';
import calendarService from './calendarService';

class IntegrationController {
  public async getIntegrations(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const isSuperAdmin = req.user?.role?.name === 'SUPER_ADMIN';
      const response = await integrationService.getIntegrations(isSuperAdmin ? undefined : req.user?.id);
      wrapResult(res, response);
    } catch (error) {
      next(error);
    }
  }

  public async upsertIntegration(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const isSuperAdmin = req.user?.role?.name === 'SUPER_ADMIN';
      const userId = isSuperAdmin && req.body.systemWide ? undefined : req.user?.id;
      const response = await integrationService.upsertIntegration(req.body, userId);
      wrapResult(res, response);
    } catch (error) {
      next(error);
    }
  }

  public async deleteIntegration(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const response = await integrationService.deleteIntegration(req.params.id as string);
      wrapResult(res, response);
    } catch (error) {
      next(error);
    }
  }

  public async getGoogleAuthUrl(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { clientId, clientSecret, redirectUri } = req.body;
      const url = await calendarService.getGoogleAuthUrl(clientId, clientSecret, redirectUri);
      wrapResult(res, { url });
    } catch (error) {
      next(error);
    }
  }

  public async handleGoogleCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code } = req.query;
      // In a better flow, we'd exchange tokens here
      res.redirect(`${process.env.FRONTEND_URL}/settings/integrations?status=success&provider=google&code=${code}`);
    } catch (error) {
      next(error);
    }
  }

  public async handleOutlookCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code } = req.query;
      res.redirect(`${process.env.FRONTEND_URL}/settings/integrations?status=success&provider=outlook&code=${code}`);
    } catch (error) {
      next(error);
    }
  }
}

export default new IntegrationController();
