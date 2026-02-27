import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { wrapResult } from '../utils/response/responseWrapper';
import commissionService from './commissionService';

class CommissionController {
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const result = await commissionService.create(req.body, tenantId);
      wrapResult(res, result, 201);
    } catch (e) { next(e); }
  }
  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const result = await commissionService.getAll(req.query, tenantId);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }
  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await commissionService.update(Number(req.params.id), req.body);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }
  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await commissionService.delete(Number(req.params.id));
      wrapResult(res, { deleted: true });
    } catch (e) { next(e); }
  }

  /** POST /calculate — auto-calculate commission from a deal */
  async calculate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const { dealId, userId, rate } = req.body;
      if (!dealId || !userId) {
        return wrapResult(res, { message: 'dealId and userId are required' }, 400);
      }
      const result = await commissionService.calculateCommission(dealId, userId, tenantId, rate);
      wrapResult(res, result, 201);
    } catch (e) { next(e); }
  }

  /** POST /calculate-tiered — calculate tiered commission (stateless) */
  async calculateTiered(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { dealValue, tiers } = req.body;
      if (!dealValue || !tiers || !Array.isArray(tiers)) {
        return wrapResult(res, { message: 'dealValue and tiers array are required' }, 400);
      }
      const result = commissionService.calculateTieredCommission(dealValue, tiers);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  /** GET /summary/:userId — aggregated commission summary for a user */
  async summary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const result = await commissionService.getCommissionSummary(Number(req.params.userId), tenantId);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  /** PUT /:id/pay — mark a commission as PAID */
  async markAsPaid(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await commissionService.markAsPaid(Number(req.params.id));
      if (!result) return wrapResult(res, { message: 'Commission not found' }, 404);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  /** GET /team — team-level commission summary */
  async teamCommissions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const period = {
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined
      };
      const result = await commissionService.getTeamCommissions(tenantId, period);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  /** POST /apply-plan — apply a commission plan to a deal */
  async applyPlan(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const { dealId, userId, plan } = req.body;
      if (!dealId || !userId || !plan) {
        return wrapResult(res, { message: 'dealId, userId, and plan are required' }, 400);
      }
      const result = await commissionService.applyCommissionPlan(dealId, userId, plan, tenantId);
      wrapResult(res, result, 201);
    } catch (e) { next(e); }
  }

  /** POST /deal-won — auto-create commission when a deal is won */
  async dealWon(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const { dealId, userId, rate } = req.body;
      if (!dealId || !userId) {
        return wrapResult(res, { message: 'dealId and userId are required' }, 400);
      }
      const result = await commissionService.onDealWon(dealId, userId, tenantId, rate);
      wrapResult(res, result, 201);
    } catch (e) { next(e); }
  }

  /** POST /bulk-payout — mark multiple commissions as paid */
  async bulkPayout(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { ids } = req.body;
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return wrapResult(res, { message: 'ids array is required' }, 400);
      }
      const result = await commissionService.bulkPayout(ids);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  /** GET /analytics — commission analytics */
  async analytics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const query = {
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        staffId: req.query.staffId ? Number(req.query.staffId) : undefined,
        period: (req.query.period as 'monthly' | 'quarterly') || 'monthly'
      };
      const result = await commissionService.getAnalytics(tenantId, query);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  /** GET /dashboard-kpis — quick KPI stats for dashboard */
  async dashboardKPIs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const result = await commissionService.getDashboardKPIs(tenantId);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }
}

export default new CommissionController();
