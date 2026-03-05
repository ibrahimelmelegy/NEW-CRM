import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { wrapResult } from '../utils/response/responseWrapper';
import socialListeningService from './socialListeningService';

class SocialListeningController {
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId!;
      const result = await socialListeningService.create(req.body, tenantId);
      wrapResult(res, result, 201);
    } catch (e) {
      next(e);
    }
  }

  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId!;
      const result = await socialListeningService.getAll(req.query, tenantId);
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await socialListeningService.getById(Number(req.params.id));
      if (!result) return wrapResult(res, { message: 'Mention not found' }, 404);
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await socialListeningService.update(Number(req.params.id), req.body);
      if (!result) return wrapResult(res, { message: 'Mention not found' }, 404);
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const deleted = await socialListeningService.delete(Number(req.params.id));
      if (!deleted) return wrapResult(res, { message: 'Mention not found' }, 404);
      wrapResult(res, { deleted: true });
    } catch (e) {
      next(e);
    }
  }

  async getSentimentAggregation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId!;
      const days = Number(req.query.days) || 30;
      const result = await socialListeningService.getSentimentAggregation(tenantId, days);
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  async getTrendingKeywords(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId!;
      const limit = Number(req.query.limit) || 10;
      const result = await socialListeningService.getTrendingKeywords(tenantId, limit);
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }
}

export default new SocialListeningController();
