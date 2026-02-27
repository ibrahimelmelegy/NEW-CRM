import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { wrapResult } from '../utils/response/responseWrapper';
import competitorService from './competitorService';

class CompetitorController {
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const result = await competitorService.create(req.body, tenantId);
      wrapResult(res, result, 201);
    } catch (e) { next(e); }
  }
  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const result = await competitorService.getAll(req.query, tenantId);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }
  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await competitorService.getById(Number(req.params.id));
      wrapResult(res, result);
    } catch (e) { next(e); }
  }
  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await competitorService.update(Number(req.params.id), req.body);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }
  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await competitorService.delete(Number(req.params.id));
      wrapResult(res, { deleted: true });
    } catch (e) { next(e); }
  }

  /** GET /analysis/:id — win/loss analysis for a specific competitor */
  async analysis(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const result = await competitorService.getCompetitorAnalysis(Number(req.params.id), tenantId);
      if (!result) return wrapResult(res, { message: 'Competitor not found' }, 404);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  /** GET /threat-matrix — all competitors ranked by threat */
  async threatMatrix(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const result = await competitorService.getThreatMatrix(tenantId);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  /** PUT /:id/threat-level — auto-recalculate threat level */
  async updateThreatLevel(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await competitorService.updateThreatLevel(Number(req.params.id), req.body);
      if (!result) return wrapResult(res, { message: 'Competitor not found' }, 404);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }
}

export default new CompetitorController();
