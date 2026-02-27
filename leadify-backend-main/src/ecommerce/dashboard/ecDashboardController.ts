import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../../types';
import { wrapResult } from '../../utils/response/responseWrapper';
import ecDashboardService from './ecDashboardService';

class EcDashboardController {
  public async getDashboardStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await ecDashboardService.getDashboardStats();
      wrapResult(res, stats);
    } catch (error) {
      next(error);
    }
  }
}

export default new EcDashboardController();
