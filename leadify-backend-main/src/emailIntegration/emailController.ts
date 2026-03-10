import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { wrapResult } from '../utils/response/responseWrapper';
import emailIntegrationService from './emailIntegrationService';

class EmailController {
  public async getAccounts(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
    try {
      const accounts = await emailIntegrationService.getAccounts(String(req.user!.id));
      wrapResult(res, accounts);
    } catch (error) {
      // Return empty array instead of 500 when email integration isn't set up
      console.error('[EmailController] getAccounts error:', (error as Error).message);
      wrapResult(res, []);
    }
  }

  public async connectAccount(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const account = await emailIntegrationService.connectAccount({
        ...req.body,
        userId: req.user!.id
      });
      wrapResult(res, account, 201);
    } catch (error) {
      next(error);
    }
  }

  public async disconnectAccount(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await emailIntegrationService.disconnectAccount(req.params.id as string);
      wrapResult(res, { deleted: true });
    } catch (error) {
      next(error);
    }
  }

  public async getMessages(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
    try {
      // If no accountId provided, get messages from all user accounts
      const accountId = req.query.accountId as string;
      if (!accountId) {
        // Return empty when no account specified
        wrapResult(res, {
          docs: [],
          pagination: { page: 1, limit: 20, totalItems: 0, totalPages: 0 }
        });
        return;
      }
      const result = await emailIntegrationService.getMessages(accountId, req.query);
      wrapResult(res, result);
    } catch (error) {
      // Return empty result instead of 500
      console.error('[EmailController] getMessages error:', (error as Error).message);
      wrapResult(res, {
        docs: [],
        pagination: { page: 1, limit: 20, totalItems: 0, totalPages: 0 }
      });
    }
  }

  public async sendEmail(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const message = await emailIntegrationService.sendEmail(req.body.accountId, req.body);
      wrapResult(res, message, 201);
    } catch (error) {
      next(error);
    }
  }

  public async getTracking(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
    try {
      const tracking = await emailIntegrationService.getTracking(req.params.messageId as string);
      wrapResult(res, tracking);
    } catch (error) {
      // Return empty array instead of 500
      console.error('[EmailController] getTracking error:', (error as Error).message);
      wrapResult(res, []);
    }
  }
}

export default new EmailController();
