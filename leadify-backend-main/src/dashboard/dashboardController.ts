import { Response, NextFunction } from 'express';
import { wrapResult } from '../utils/response/responseWrapper';
import dashboardService from './dashboardService';
import { AuthenticatedRequest } from '../types';

class DashboardController {
  async getDashboards(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const role = req.query.role as string | undefined;
      const dashboards = await dashboardService.getDashboards(req.user!.id, role);
      wrapResult(res, dashboards);
    } catch (error) {
      next(error);
    }
  }

  async getDashboardById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const dashboard = await dashboardService.getDashboardById(Number(req.params.id));
      wrapResult(res, dashboard);
    } catch (error) {
      next(error);
    }
  }

  async createDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const dashboard = await dashboardService.createDashboard(req.body, req.user!.id);
      wrapResult(res, dashboard, 201);
    } catch (error) {
      next(error);
    }
  }

  async updateDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const dashboard = await dashboardService.updateDashboard(
        Number(req.params.id),
        req.body,
        req.user!.id
      );
      wrapResult(res, dashboard);
    } catch (error) {
      next(error);
    }
  }

  async deleteDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await dashboardService.deleteDashboard(Number(req.params.id), req.user!.id);
      wrapResult(res, { deleted: true });
    } catch (error) {
      next(error);
    }
  }

  async setDefault(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const dashboard = await dashboardService.setDefault(
        Number(req.params.id),
        req.user!.id
      );
      wrapResult(res, dashboard);
    } catch (error) {
      next(error);
    }
  }

  async getWidgetData(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await dashboardService.getWidgetData(req.body);
      wrapResult(res, data);
    } catch (error) {
      next(error);
    }
  }

  async getExecutiveSummary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await dashboardService.getExecutiveSummary();
      wrapResult(res, data);
    } catch (error) {
      next(error);
    }
  }

  async getPipeline(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const dateRange = req.query.dateRange as string | undefined;
      const data = await dashboardService.getSalesPipelineData(dateRange);
      wrapResult(res, data);
    } catch (error) {
      next(error);
    }
  }

  async getRevenue(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const period = req.query.period as string || 'monthly';
      const dateRange = req.query.dateRange as string | undefined;
      const data = await dashboardService.getRevenueChart(period, dateRange);
      wrapResult(res, data);
    } catch (error) {
      next(error);
    }
  }

  async getTeamPerformance(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const dateRange = req.query.dateRange as string | undefined;
      const data = await dashboardService.getTeamPerformance(dateRange);
      wrapResult(res, data);
    } catch (error) {
      next(error);
    }
  }

  async getAnalyticsSummary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
      const data = await dashboardService.getAnalyticsSummary(startDate, endDate);
      wrapResult(res, data);
    } catch (error) {
      next(error);
    }
  }

  async getLeadSources(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
      const data = await dashboardService.getLeadSources(startDate, endDate);
      wrapResult(res, data);
    } catch (error) {
      next(error);
    }
  }

  async getWinLoss(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
      const data = await dashboardService.getWinLoss(startDate, endDate);
      wrapResult(res, data);
    } catch (error) {
      next(error);
    }
  }

  async getAvgDealSize(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
      const data = await dashboardService.getAvgDealSize(startDate, endDate);
      wrapResult(res, data);
    } catch (error) {
      next(error);
    }
  }

  async getConversionFunnel(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
      const data = await dashboardService.getConversionFunnel(startDate, endDate);
      wrapResult(res, data);
    } catch (error) {
      next(error);
    }
  }
}

export default new DashboardController();
