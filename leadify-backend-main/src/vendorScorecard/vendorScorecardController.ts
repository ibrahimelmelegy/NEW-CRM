import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { wrapResult } from '../utils/response/responseWrapper';
import service from './vendorScorecardService';

class VendorScorecardController {
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { wrapResult(res, await service.create(req.body, (req.user as any)?.tenantId), 201); } catch (e) { next(e); }
  }
  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { wrapResult(res, await service.getAll(req.query, (req.user as any)?.tenantId)); } catch (e) { next(e); }
  }
  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { wrapResult(res, await service.update(Number(req.params.id), req.body)); } catch (e) { next(e); }
  }
  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { await service.delete(Number(req.params.id)); wrapResult(res, { deleted: true }); } catch (e) { next(e); }
  }

  // ─── New Business Logic Endpoints ────────────────────────────────────────────

  async getVendorTrend(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const vendorId = Number(req.params.vendorId);
      const periods = req.query.periods ? Number(req.query.periods) : 6;
      wrapResult(res, await service.getVendorTrend(vendorId, periods));
    } catch (e) { next(e); }
  }

  async getVendorRanking(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      wrapResult(res, await service.getVendorRanking(tenantId));
    } catch (e) { next(e); }
  }

  async getBenchmark(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      wrapResult(res, await service.getBenchmark(tenantId));
    } catch (e) { next(e); }
  }

  async flagUnderperformers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const threshold = req.query.threshold ? Number(req.query.threshold) : 60;
      wrapResult(res, await service.flagUnderperformers(tenantId, threshold));
    } catch (e) { next(e); }
  }
}
export default new VendorScorecardController();
