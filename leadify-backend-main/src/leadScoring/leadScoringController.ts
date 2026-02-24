import { Response, NextFunction } from 'express';
import { wrapResult } from '../utils/response/responseWrapper';
import leadScoringService from './leadScoringService';
import { AuthenticatedRequest } from '../types';

class LeadScoringController {
  async getRules(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { wrapResult(res, await leadScoringService.getRules(req.query)); }
    catch (error) { next(error); }
  }

  async createRule(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { wrapResult(res, await leadScoringService.createRule(req.body, req.user!.id), 201); }
    catch (error) { next(error); }
  }

  async updateRule(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { wrapResult(res, await leadScoringService.updateRule(Number(req.params.id), req.body)); }
    catch (error) { next(error); }
  }

  async deleteRule(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { wrapResult(res, await leadScoringService.deleteRule(Number(req.params.id))); }
    catch (error) { next(error); }
  }

  async calculateScore(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { wrapResult(res, await leadScoringService.calculateScore(req.params.entityType as string, req.params.entityId as string)); }
    catch (error) { next(error); }
  }

  async bulkCalculateScores(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { wrapResult(res, await leadScoringService.bulkCalculateScores(req.params.entityType as string)); }
    catch (error) { next(error); }
  }

  async getScore(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { wrapResult(res, await leadScoringService.getScore(req.params.entityType as string, req.params.entityId as string)); }
    catch (error) { next(error); }
  }

  async getTopScored(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 20;
      wrapResult(res, await leadScoringService.getTopScored(req.params.entityType as string, limit));
    }
    catch (error) { next(error); }
  }

  async getGradeThresholds(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { wrapResult(res, leadScoringService.getGradeThresholds()); }
    catch (error) { next(error); }
  }
}

export default new LeadScoringController();
