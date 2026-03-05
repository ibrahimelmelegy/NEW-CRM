import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { wrapResult } from '../utils/response/responseWrapper';
import service from './abTestService';

class ABTestController {
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await service.create(req.body, req.user!.tenantId!), 201);
    } catch (e) {
      next(e);
    }
  }
  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await service.getAll(req.query, req.user!.tenantId!));
    } catch (e) {
      next(e);
    }
  }
  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await service.update(Number(req.params.id), req.body));
    } catch (e) {
      next(e);
    }
  }
  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await service.delete(Number(req.params.id));
      wrapResult(res, { deleted: true });
    } catch (e) {
      next(e);
    }
  }

  async getResults(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await service.getTestResults(Number(req.params.id));
      if (!result) return res.status(404).send({ success: false, message: 'Test not found' });
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  async declareWinner(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await service.declareWinner(Number(req.params.id));
      if (!result) return res.status(404).send({ success: false, message: 'Test not found or cannot declare winner' });
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  async recordImpression(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { variantId } = req.body;
      if (!variantId) return res.status(400).send({ success: false, message: 'variantId is required' });
      const result = await service.recordImpression(Number(req.params.id), variantId);
      if (!result) return res.status(404).send({ success: false, message: 'Test not found or not running' });
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  async recordConversion(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { variantId } = req.body;
      if (!variantId) return res.status(400).send({ success: false, message: 'variantId is required' });
      const result = await service.recordConversion(Number(req.params.id), variantId);
      if (!result) return res.status(404).send({ success: false, message: 'Test not found or not running' });
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  async getActiveTests(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId!;
      wrapResult(res, await service.getActiveTests(tenantId));
    } catch (e) {
      next(e);
    }
  }
}
export default new ABTestController();
