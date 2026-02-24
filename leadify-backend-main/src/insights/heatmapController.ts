import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { wrapResult } from '../utils/response/responseWrapper';
import heatmapService from './heatmapService';

class HeatmapController {
  public async getHeatmap(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const data = await heatmapService.getHeatmapData(year, userId);
      wrapResult(res, data);
    } catch (error) {
      next(error);
    }
  }

  public async getRecentActivity(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const data = await heatmapService.getRecentActivity(limit);
      wrapResult(res, data);
    } catch (error) {
      next(error);
    }
  }
}

export default new HeatmapController();
