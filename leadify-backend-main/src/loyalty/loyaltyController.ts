import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { wrapResult } from '../utils/response/responseWrapper';
import service from './loyaltyService';

class LoyaltyController {
  async createProgram(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await service.createProgram(req.body, req.user!.tenantId!), 201);
    } catch (e) {
      next(e);
    }
  }
  async getPrograms(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await service.getPrograms(req.query, req.user!.tenantId!));
    } catch (e) {
      next(e);
    }
  }
  async updateProgram(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await service.updateProgram(Number(req.params.id), req.body));
    } catch (e) {
      next(e);
    }
  }
  async deleteProgram(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await service.deleteProgram(Number(req.params.id));
      wrapResult(res, { deleted: true });
    } catch (e) {
      next(e);
    }
  }
  async addPoints(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await service.addPoints(req.body, req.user!.tenantId!), 201);
    } catch (e) {
      next(e);
    }
  }
  async getPointsHistory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await service.getPointsHistory(req.query, req.user!.tenantId!));
    } catch (e) {
      next(e);
    }
  }
  async getClientBalance(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await service.getClientBalance(req.params.clientId as string, Number(req.params.programId)));
    } catch (e) {
      next(e);
    }
  }
}
export default new LoyaltyController();
