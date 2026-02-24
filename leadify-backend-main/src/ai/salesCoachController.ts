import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { wrapResult } from '../utils/response/responseWrapper';
import salesCoachService from './salesCoachService';

class SalesCoachController {
  public async analyzeDeal(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const result = await salesCoachService.analyzeDeal(id);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async getPipelineHealth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await salesCoachService.getPipelineHealth();
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async getWeeklySummary(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await salesCoachService.getWeeklySummary();
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export default new SalesCoachController();
