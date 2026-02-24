import { Request, Response } from 'express';
import customerSuccessService from './customerSuccessService';
import { wrapResult } from '../utils/response/responseWrapper';

class CustomerSuccessController {
  // GET /api/customer-success/dashboard
  public async getDashboard(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      const dashboard = await customerSuccessService.getDashboard(tenantId);
      wrapResult(res, dashboard, 200);
    } catch (error: any) {
      console.error('[CustomerSuccess] Dashboard error:', error.message);
      // Return empty dashboard instead of 500
      wrapResult(res, {
        clients: [],
        healthDistribution: { healthy: 0, atRisk: 0, critical: 0 },
        recentActivity: [],
        avgHealthScore: 0,
        totalClients: 0
      }, 200);
    }
  }

  // GET /api/customer-success/client/:id/health
  public async getClientHealth(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenantId: string | undefined = (req as any).user?.tenantId;
      const health = await customerSuccessService.getClientHealth(id as string, tenantId);

      if (!health) {
        return wrapResult(res, null, 404);
      }

      wrapResult(res, health, 200);
    } catch (error: any) {
      console.error('[CustomerSuccess] Client health error:', error.message);
      wrapResult(res, null, 500);
    }
  }
}

export default new CustomerSuccessController();
