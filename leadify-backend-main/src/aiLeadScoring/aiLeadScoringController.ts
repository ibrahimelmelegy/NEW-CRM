import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { wrapResult } from '../utils/response/responseWrapper';
import aiLeadScoringService from './aiLeadScoringService';

class AiLeadScoringController {
  // ─── Model Config CRUD ─────────────────────────────────────────────────────
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const createdBy = (req.user as any)?.id;
      const result = await aiLeadScoringService.create(req.body, tenantId, createdBy);
      wrapResult(res, result, 201);
    } catch (e) { next(e); }
  }

  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const result = await aiLeadScoringService.getAll(req.query, tenantId);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await aiLeadScoringService.getById(Number(req.params.id));
      if (!result) return wrapResult(res, { message: 'Scoring model not found' }, 404);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await aiLeadScoringService.update(Number(req.params.id), req.body);
      if (!result) return wrapResult(res, { message: 'Scoring model not found' }, 404);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const deleted = await aiLeadScoringService.delete(Number(req.params.id));
      if (!deleted) return wrapResult(res, { message: 'Scoring model not found' }, 404);
      wrapResult(res, { deleted: true });
    } catch (e) { next(e); }
  }

  // ─── Scoring & Analysis ────────────────────────────────────────────────────
  async scoreLeads(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const { leadIds } = req.body;
      const result = await aiLeadScoringService.scoreLeads(Number(req.params.id), leadIds, tenantId);
      if (!result) return wrapResult(res, { message: 'Scoring model not found' }, 404);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  async getFeatureImportance(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const result = await aiLeadScoringService.getFeatureImportance(Number(req.params.id), tenantId);
      if (!result) return wrapResult(res, { message: 'Scoring model not found' }, 404);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  async compareModels(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { modelIds } = req.body;
      const result = await aiLeadScoringService.compareModels(modelIds);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }
}

export default new AiLeadScoringController();
