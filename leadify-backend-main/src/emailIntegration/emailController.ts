import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { wrapResult } from '../utils/response/responseWrapper';
import emailIntegrationService from './emailIntegrationService';

class EmailController {
  public async getAccounts(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const accounts = await emailIntegrationService.getAccounts(String(req.user!.id));
      wrapResult(res, accounts);
    } catch (error) {
      next(error);
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

  public async getMessages(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await emailIntegrationService.getMessages(
        req.query.accountId as string,
        req.query
      );
      wrapResult(res, result);
    } catch (error) {
      next(error);
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

  public async getTracking(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tracking = await emailIntegrationService.getTracking(req.params.messageId as string);
      wrapResult(res, tracking);
    } catch (error) {
      next(error);
    }
  }
}

export default new EmailController();
