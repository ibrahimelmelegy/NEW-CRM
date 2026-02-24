import { Response, NextFunction } from 'express';
import { wrapResult } from '../utils/response/responseWrapper';
import webhookService from './webhookService';
import { AuthenticatedRequest } from '../types';

class WebhookController {
  async getAll(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const webhooks = await webhookService.getAll();
      wrapResult(res, webhooks);
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const webhook = await webhookService.create(req.body);
      wrapResult(res, webhook, 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const webhook = await webhookService.update(req.params.id as string, req.body);
      wrapResult(res, webhook);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await webhookService.delete(req.params.id as string);
      wrapResult(res, { deleted: true });
    } catch (error) {
      next(error);
    }
  }

  async test(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await webhookService.test(req.params.id as string);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export default new WebhookController();
