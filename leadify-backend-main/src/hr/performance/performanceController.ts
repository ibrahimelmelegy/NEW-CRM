import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types';
import { wrapResult } from '../../utils/response/responseWrapper';
import performanceService from './performanceService';

class PerformanceController {
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId!;
      const result = await performanceService.create(req.body, tenantId);
      wrapResult(res, result, 201);
    } catch (e) {
      next(e);
    }
  }

  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId!;
      const result = await performanceService.getAll(req.query, tenantId);
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await performanceService.getById(Number(req.params.id));
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await performanceService.update(Number(req.params.id), req.body);
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await performanceService.delete(Number(req.params.id));
      wrapResult(res, { deleted: true });
    } catch (e) {
      next(e);
    }
  }

  async calculateRating(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await performanceService.calculateOverallRating(Number(req.params.id));
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  async getDistribution(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId!;
      const result = await performanceService.getPerformanceDistribution(tenantId, req.query.period as string);
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  async getTeamPerformance(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await performanceService.getTeamPerformance(req.params.managerId as string, req.query.period as string);
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  async comparePerformance(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const periods = ((req.query.periods as string) || '').split(',').filter(Boolean);
      const result = await performanceService.comparePerformance(Number(req.params.employeeId), periods);
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  async submitReview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await performanceService.submitReview(Number(req.params.id));
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  async approveReview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const approverId = req.user!.id;
      const result = await performanceService.approveReview(Number(req.params.id), approverId);
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }
}

export default new PerformanceController();
