import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { wrapResult } from '../utils/response/responseWrapper';
import clvService from './clvService';

class ClvController {
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const result = await clvService.create(req.body, tenantId);
      wrapResult(res, result, 201);
    } catch (e) { next(e); }
  }

  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const result = await clvService.getAll(req.query, tenantId);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await clvService.getById(Number(req.params.id));
      if (!result) return wrapResult(res, { message: 'CLV record not found' }, 404);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await clvService.update(Number(req.params.id), req.body);
      if (!result) return wrapResult(res, { message: 'CLV record not found' }, 404);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const deleted = await clvService.delete(Number(req.params.id));
      if (!deleted) return wrapResult(res, { message: 'CLV record not found' }, 404);
      wrapResult(res, { deleted: true });
    } catch (e) { next(e); }
  }

  async calculate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const result = await clvService.calculateCLV(req.body, tenantId);
      wrapResult(res, result, 201);
    } catch (e) { next(e); }
  }

  async getCohortAnalysis(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const result = await clvService.getCohortAnalysis(tenantId);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  async getChurnPredictions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const limit = Number(req.query.limit) || 20;
      const result = await clvService.getChurnPredictions(tenantId, limit);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }
}

export default new ClvController();
