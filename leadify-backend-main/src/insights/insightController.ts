import insightService from './insightService';
import { AuthenticatedRequest } from '../types';
import { wrapResult } from '../utils/response/responseWrapper';
import { NextFunction, Response } from 'express';
import User from '../user/userModel';
import cacheService from '../utils/cacheService';

class InsightController {
  async getLeadsSalesInsights(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as User).id;
      const cacheKey = `insights:leadsSales:${userId}`;
      const cachedData = await cacheService.get(cacheKey);

      if (cachedData) {
        wrapResult(res, cachedData);
        return;
      }

      const responseFromService = await insightService.getLeadsSalesInsights(req.user as User);
      await cacheService.set(cacheKey, responseFromService);
      wrapResult(res, responseFromService);
    } catch (error) {
      next(error);
    }
  }

  async getProjectsOperationsInsights(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as User).id;
      const cacheKey = `insights:projectsOperations:${userId}`;
      const cachedData = await cacheService.get(cacheKey);

      if (cachedData) {
        wrapResult(res, cachedData);
        return;
      }

      const responseFromService = await insightService.getProjectsOperationsInsights(req.user as User);
      await cacheService.set(cacheKey, responseFromService);
      wrapResult(res, responseFromService);
    } catch (error) {
      next(error);
    }
  }

  async getFinancialAndBusinessMetricsInsights(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as User).id;
      const cacheKey = `insights:financial:${userId}`;
      const cachedData = await cacheService.get(cacheKey);

      if (cachedData) {
        wrapResult(res, cachedData);
        return;
      }

      const responseFromService = await insightService.getFinancialAndBusinessMetricsInsights(req.user as User);
      await cacheService.set(cacheKey, responseFromService);
      wrapResult(res, responseFromService);
    } catch (error) {
      next(error);
    }
  }

  async getPerformanceAndHRInsights(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as User).id;
      const cacheKey = `insights:performance:${userId}`;
      const cachedData = await cacheService.get(cacheKey);

      if (cachedData) {
        wrapResult(res, cachedData);
        return;
      }

      const responseFromService = await insightService.getPerformanceAndHRInsights(req.user as User);
      await cacheService.set(cacheKey, responseFromService);
      wrapResult(res, responseFromService);
    } catch (error) {
      next(error);
    }
  }
}
export default new InsightController();
