import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { wrapResult } from '../utils/response/responseWrapper';
import accountPlanService from './accountPlanService';

class AccountPlanController {
  // ─── Account Plan CRUD ─────────────────────────────────────────────────────
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId!;
      const ownerId = req.user?.id;
      const result = await accountPlanService.create(req.body, tenantId, ownerId);
      wrapResult(res, result, 201);
    } catch (e) {
      next(e);
    }
  }

  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId!;
      const result = await accountPlanService.getAll(req.query, tenantId);
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await accountPlanService.getById(Number(req.params.id));
      if (!result) return wrapResult(res, { message: 'Account plan not found' }, 404);
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await accountPlanService.update(Number(req.params.id), req.body);
      if (!result) return wrapResult(res, { message: 'Account plan not found' }, 404);
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const deleted = await accountPlanService.delete(Number(req.params.id));
      if (!deleted) return wrapResult(res, { message: 'Account plan not found' }, 404);
      wrapResult(res, { deleted: true });
    } catch (e) {
      next(e);
    }
  }

  // ─── Stakeholders ─────────────────────────────────────────────────────────
  async addStakeholder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId!;
      const result = await accountPlanService.addStakeholder({ ...req.body, accountPlanId: Number(req.params.id) }, tenantId);
      wrapResult(res, result, 201);
    } catch (e) {
      next(e);
    }
  }

  async getStakeholders(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await accountPlanService.getStakeholders(Number(req.params.id));
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  async updateStakeholder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await accountPlanService.updateStakeholder(Number(req.params.stakeholderId), req.body);
      if (!result) return wrapResult(res, { message: 'Stakeholder not found' }, 404);
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  async deleteStakeholder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const deleted = await accountPlanService.deleteStakeholder(Number(req.params.stakeholderId));
      if (!deleted) return wrapResult(res, { message: 'Stakeholder not found' }, 404);
      wrapResult(res, { deleted: true });
    } catch (e) {
      next(e);
    }
  }

  // ─── Analytics ─────────────────────────────────────────────────────────────
  async getWhitespace(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId!;
      const result = await accountPlanService.getWhitespaceAnalysis(tenantId);
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  async getForecast(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId!;
      const result = await accountPlanService.getForecast(tenantId);
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }
}

export default new AccountPlanController();
