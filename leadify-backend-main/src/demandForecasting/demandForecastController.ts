import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { wrapResult } from '../utils/response/responseWrapper';
import demandForecastService from './demandForecastService';

class DemandForecastController {
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const createdBy = (req.user as any)?.id;
      const result = await demandForecastService.create(req.body, tenantId, createdBy);
      wrapResult(res, result, 201);
    } catch (e) { next(e); }
  }

  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const result = await demandForecastService.getAll(req.query, tenantId);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await demandForecastService.getById(Number(req.params.id));
      if (!result) return wrapResult(res, { message: 'Forecast not found' }, 404);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await demandForecastService.update(Number(req.params.id), req.body);
      if (!result) return wrapResult(res, { message: 'Forecast not found' }, 404);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const deleted = await demandForecastService.delete(Number(req.params.id));
      if (!deleted) return wrapResult(res, { message: 'Forecast not found' }, 404);
      wrapResult(res, { deleted: true });
    } catch (e) { next(e); }
  }

  async generate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const createdBy = (req.user as any)?.id;
      const result = await demandForecastService.generateForecast(req.body, tenantId, createdBy);
      wrapResult(res, result, 201);
    } catch (e) { next(e); }
  }

  async getAccuracyReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const result = await demandForecastService.getAccuracyReport(tenantId);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }
}

export default new DemandForecastController();
