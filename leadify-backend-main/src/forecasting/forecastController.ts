import { Response, NextFunction } from 'express';
import { wrapResult } from '../utils/response/responseWrapper';
import forecastService from './forecastService';
import { AuthenticatedRequest } from '../types';

class ForecastController {
  async getForecasts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { userId, period, page, limit } = req.query;
      wrapResult(
        res,
        await forecastService.getForecasts({
          userId: userId as string,
          period: period as string,
          page: page ? Number(page) : undefined,
          limit: limit ? Number(limit) : undefined
        })
      );
    } catch (error) {
      next(error);
    }
  }

  async getByPeriod(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { period, startDate, endDate } = req.query;
      if (!period || !startDate || !endDate) {
        res.status(400).json({ message: 'period, startDate, and endDate are required' });
        return;
      }
      wrapResult(res, await forecastService.getByPeriod(period as string, startDate as string, endDate as string));
    } catch (error) {
      next(error);
    }
  }

  async getByUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await forecastService.getByUser(req.params.userId as string));
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await forecastService.createForecast({ ...req.body, userId: String(req.user!.id) }), 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await forecastService.updateForecast(req.params.id as string, req.body));
    } catch (error) {
      next(error);
    }
  }

  async calculateFromPipeline(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { period } = req.body;
      if (!period) {
        res.status(400).json({ message: 'period is required' });
        return;
      }
      wrapResult(res, await forecastService.calculateFromPipeline(String(req.user!.id), period));
    } catch (error) {
      next(error);
    }
  }

  async getHistoricalComparison(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { period, startDate, endDate } = req.query;
      if (!period || !startDate || !endDate) {
        res.status(400).json({ message: 'period, startDate, and endDate are required' });
        return;
      }
      wrapResult(res, await forecastService.getHistoricalComparison(period as string, startDate as string, endDate as string));
    } catch (error) {
      next(error);
    }
  }

  async getScenarioProjection(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { winRateAdjustment, dealValueAdjustment } = req.body;
      wrapResult(
        res,
        await forecastService.getScenarioProjection(
          String(req.user!.id),
          Number(winRateAdjustment || 0),
          Number(dealValueAdjustment || 0)
        )
      );
    } catch (error) {
      next(error);
    }
  }

  async getTeamBreakdown(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { period, startDate, endDate } = req.query;
      if (!period || !startDate || !endDate) {
        res.status(400).json({ message: 'period, startDate, and endDate are required' });
        return;
      }
      wrapResult(res, await forecastService.getTeamBreakdown(period as string, startDate as string, endDate as string));
    } catch (error) {
      next(error);
    }
  }
}

export default new ForecastController();
