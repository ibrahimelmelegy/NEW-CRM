import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { wrapResult } from '../utils/response/responseWrapper';
import cartRecoveryService from './cartRecoveryService';

class CartRecoveryController {
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId!;
      const result = await cartRecoveryService.create(req.body, tenantId);
      wrapResult(res, result, 201);
    } catch (e) {
      next(e);
    }
  }

  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId!;
      const result = await cartRecoveryService.getAll(req.query, tenantId);
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await cartRecoveryService.getById(Number(req.params.id));
      if (!result) return wrapResult(res, { message: 'Cart not found' }, 404);
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await cartRecoveryService.update(Number(req.params.id), req.body);
      if (!result) return wrapResult(res, { message: 'Cart not found' }, 404);
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const deleted = await cartRecoveryService.delete(Number(req.params.id));
      if (!deleted) return wrapResult(res, { message: 'Cart not found' }, 404);
      wrapResult(res, { deleted: true });
    } catch (e) {
      next(e);
    }
  }

  async sendReminder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await cartRecoveryService.sendRecoveryReminder(Number(req.params.id));
      if (!result) return wrapResult(res, { message: 'Cart not found' }, 404);
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  async markRecovered(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await cartRecoveryService.markRecovered(Number(req.params.id));
      if (!result) return wrapResult(res, { message: 'Cart not found' }, 404);
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  async expireOldCarts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId!;
      const days = Number(req.query.days) || 30;
      const result = await cartRecoveryService.expireOldCarts(days, tenantId);
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  async getStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId!;
      const result = await cartRecoveryService.getRecoveryStats(tenantId);
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }
}

export default new CartRecoveryController();
