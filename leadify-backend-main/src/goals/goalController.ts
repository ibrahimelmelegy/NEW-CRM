import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { wrapResult } from '../utils/response/responseWrapper';
import goalService from './goalService';

class GoalController {
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const result = await goalService.create(req.body, tenantId);
      wrapResult(res, result, 201);
    } catch (e) { next(e); }
  }

  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const result = await goalService.getAll(req.query, tenantId);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await goalService.getById(Number(req.params.id));
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await goalService.update(Number(req.params.id), req.body);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await goalService.delete(Number(req.params.id));
      wrapResult(res, { deleted: true });
    } catch (e) { next(e); }
  }

  async updateProgress(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any)?.id;
      const result = await goalService.updateProgress(Number(req.params.id), req.body.progress, userId);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  async getStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const result = await goalService.getGoalStats(tenantId, req.query.owner as string);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  async getOverdue(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const result = await goalService.getOverdueGoals(tenantId);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  async checkMilestones(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await goalService.checkMilestones(Number(req.params.id));
      wrapResult(res, result);
    } catch (e) { next(e); }
  }
}

export default new GoalController();
