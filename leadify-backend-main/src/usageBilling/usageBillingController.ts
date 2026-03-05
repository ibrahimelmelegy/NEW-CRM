import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { wrapResult } from '../utils/response/responseWrapper';
import usageBillingService from './usageBillingService';

class UsageBillingController {
  // ─── Meters ─────────────────────────────────────────────────────────────────
  async createMeter(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId!;
      const result = await usageBillingService.createMeter(req.body, tenantId);
      wrapResult(res, result, 201);
    } catch (e) {
      next(e);
    }
  }

  async getAllMeters(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId!;
      const result = await usageBillingService.getAllMeters(req.query, tenantId);
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  async getMeterById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await usageBillingService.getMeterById(Number(req.params.id));
      if (!result) return wrapResult(res, { message: 'Meter not found' }, 404);
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  async updateMeter(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await usageBillingService.updateMeter(Number(req.params.id), req.body);
      if (!result) return wrapResult(res, { message: 'Meter not found' }, 404);
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  async deleteMeter(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const deleted = await usageBillingService.deleteMeter(Number(req.params.id));
      if (!deleted) return wrapResult(res, { message: 'Meter not found' }, 404);
      wrapResult(res, { deleted: true });
    } catch (e) {
      next(e);
    }
  }

  // ─── Usage Records ──────────────────────────────────────────────────────────
  async recordUsage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId!;
      const result = await usageBillingService.recordUsage(req.body, tenantId);
      wrapResult(res, result, 201);
    } catch (e) {
      next(e);
    }
  }

  async getUsageRecords(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId!;
      const result = await usageBillingService.getUsageRecords(req.query, tenantId);
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  // ─── Billing ────────────────────────────────────────────────────────────────
  async calculateCharges(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId!;
      const { customerId, billingPeriod } = req.query as any;
      const result = await usageBillingService.calculateUsageCharges(customerId, billingPeriod, tenantId);
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  async generateInvoice(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId!;
      const { customerId, billingPeriod } = req.body;
      const result = await usageBillingService.generateInvoice(customerId, billingPeriod, tenantId);
      wrapResult(res, result, 201);
    } catch (e) {
      next(e);
    }
  }
}

export default new UsageBillingController();
