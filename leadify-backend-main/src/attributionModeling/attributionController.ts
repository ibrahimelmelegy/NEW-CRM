import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { wrapResult } from '../utils/response/responseWrapper';
import attributionService from './attributionService';

class AttributionController {
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const result = await attributionService.create(req.body, tenantId);
      wrapResult(res, result, 201);
    } catch (e) { next(e); }
  }

  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const result = await attributionService.getAll(req.query, tenantId);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await attributionService.getById(Number(req.params.id));
      if (!result) return wrapResult(res, { message: 'Touchpoint not found' }, 404);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await attributionService.update(Number(req.params.id), req.body);
      if (!result) return wrapResult(res, { message: 'Touchpoint not found' }, 404);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const deleted = await attributionService.delete(Number(req.params.id));
      if (!deleted) return wrapResult(res, { message: 'Touchpoint not found' }, 404);
      wrapResult(res, { deleted: true });
    } catch (e) { next(e); }
  }

  async calculate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const { dealId, model, dealValue } = req.body;
      const result = await attributionService.calculateAttribution(dealId, model, dealValue, tenantId);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  async getChannelPerformance(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const result = await attributionService.getChannelPerformance(tenantId);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  async compareModels(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const { dealId, dealValue } = req.body;
      const result = await attributionService.compareModels(dealId, dealValue, tenantId);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }
}

export default new AttributionController();
