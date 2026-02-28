import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { wrapResult } from '../utils/response/responseWrapper';
import segmentService from './segmentService';

class SegmentController {
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const createdBy = (req.user as any)?.id;
      const result = await segmentService.create(req.body, tenantId, createdBy);
      wrapResult(res, result, 201);
    } catch (e) { next(e); }
  }

  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const result = await segmentService.getAll(req.query, tenantId);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await segmentService.getById(Number(req.params.id));
      if (!result) return wrapResult(res, { message: 'Segment not found' }, 404);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await segmentService.update(Number(req.params.id), req.body);
      if (!result) return wrapResult(res, { message: 'Segment not found' }, 404);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const deleted = await segmentService.delete(Number(req.params.id));
      if (!deleted) return wrapResult(res, { message: 'Segment not found' }, 404);
      wrapResult(res, { deleted: true });
    } catch (e) { next(e); }
  }

  async evaluate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const result = await segmentService.evaluateSegment(Number(req.params.id), tenantId);
      if (!result) return wrapResult(res, { message: 'Segment not found' }, 404);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  async getDistribution(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const result = await segmentService.getDistribution(tenantId);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }
}

export default new SegmentController();
