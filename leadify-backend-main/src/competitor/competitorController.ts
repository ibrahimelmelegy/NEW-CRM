import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { wrapResult } from '../utils/response/responseWrapper';
import competitorService from './competitorService';

class CompetitorController {
  // ─── CRUD ─────────────────────────────────────────────────────────────────────

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId!;
      const createdBy = req.user!.id;
      const result = await competitorService.create(req.body, tenantId, createdBy);
      wrapResult(res, result, 201);
    } catch (e) {
      next(e);
    }
  }

  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId!;
      const result = await competitorService.getAll(req.query, tenantId);
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await competitorService.getById(Number(req.params.id));
      if (!result) return wrapResult(res, { message: 'Competitor not found' }, 404);
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await competitorService.update(Number(req.params.id), req.body);
      if (!result) return wrapResult(res, { message: 'Competitor not found' }, 404);
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const deleted = await competitorService.delete(Number(req.params.id));
      if (!deleted) return wrapResult(res, { message: 'Competitor not found' }, 404);
      wrapResult(res, { deleted: true });
    } catch (e) {
      next(e);
    }
  }

  // ─── Deal Association ─────────────────────────────────────────────────────────

  /** POST /:id/deals — link a competitor to a deal */
  async linkDeal(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId!;
      const { dealId, outcome, notes } = req.body;
      if (!dealId) return wrapResult(res, { message: 'dealId is required' }, 400);
      const result = await competitorService.linkDeal(Number(req.params.id), dealId, { outcome, notes }, tenantId);
      wrapResult(res, result, 201);
    } catch (e) {
      next(e);
    }
  }

  /** DELETE /:id/deals/:dealId — unlink a competitor from a deal */
  async unlinkDeal(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const deleted = await competitorService.unlinkDeal(Number(req.params.id), String(req.params.dealId));
      if (!deleted) return wrapResult(res, { message: 'Link not found' }, 404);
      wrapResult(res, { deleted: true });
    } catch (e) {
      next(e);
    }
  }

  /** GET /:id/deals — get all deals linked to a competitor */
  async getCompetitorDeals(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId!;
      const result = await competitorService.getCompetitorDeals(Number(req.params.id), tenantId);
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  // ─── Analysis & Analytics ─────────────────────────────────────────────────────

  /** GET /analysis/:id — win/loss analysis for a specific competitor */
  async analysis(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId!;
      const result = await competitorService.getCompetitorAnalysis(Number(req.params.id), tenantId);
      if (!result) return wrapResult(res, { message: 'Competitor not found' }, 404);
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  /** GET /threat-matrix — all competitors ranked by threat */
  async threatMatrix(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId!;
      const result = await competitorService.getThreatMatrix(tenantId);
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  /** PUT /:id/threat-level — auto-recalculate threat level */
  async updateThreatLevel(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await competitorService.updateThreatLevel(Number(req.params.id), req.body);
      if (!result) return wrapResult(res, { message: 'Competitor not found' }, 404);
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  /** GET /analytics/landscape — market share comparison */
  async marketLandscape(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId!;
      const result = await competitorService.getMarketLandscape(tenantId);
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  /** GET /analytics/top-threats — highest-risk competitors */
  async topThreats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId!;
      const limit = Number(req.query.limit) || 5;
      const result = await competitorService.getTopThreats(tenantId, limit);
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  /** GET /analytics/win-rates — win rate stats by competitor */
  async winRateStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId!;
      const result = await competitorService.getWinRateStats(tenantId);
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  /** GET /activity — recent competitor activity timeline */
  async getActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId!;
      const limit = Number(req.query.limit) || 10;
      const result = await competitorService.getRecentActivity(tenantId, limit);
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }
}

export default new CompetitorController();
