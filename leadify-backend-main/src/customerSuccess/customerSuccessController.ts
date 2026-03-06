import { Request, Response } from 'express';
import customerSuccessService from './customerSuccessService';
import { wrapResult } from '../utils/response/responseWrapper';

import { AuthenticatedRequest } from '../types';
class CustomerSuccessController {
  // GET /api/customer-success/dashboard
  public async getDashboard(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user!.tenantId!;
      const dashboard = await customerSuccessService.getDashboard(tenantId);
      wrapResult(res, dashboard, 200);
    } catch (error) {
      console.error('[CustomerSuccess] Dashboard error:', error instanceof Error ? error.message : String(error));
      // Return empty dashboard matching frontend shape instead of 500
      wrapResult(
        res,
        {
          summary: { totalClients: 0, healthy: 0, atRisk: 0, critical: 0, avgHealthScore: 0, totalRevenue: 0, avgNps: 0 },
          healthDistribution: [],
          topClients: [],
          atRiskClients: [],
          revenueByMonth: [],
          engagementTrend: []
        },
        200
      );
    }
  }

  // GET /api/customer-success/client/:id/health
  public async getClientHealth(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user!.tenantId!;
      const health = await customerSuccessService.getClientHealth(id as string, tenantId);

      if (!health) {
        return wrapResult(res, null, 404);
      }

      wrapResult(res, health, 200);
    } catch (error) {
      console.error('[CustomerSuccess] Client health error:', error instanceof Error ? error.message : String(error));
      wrapResult(res, null, 500);
    }
  }
}

export default new CustomerSuccessController();
