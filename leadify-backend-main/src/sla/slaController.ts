import { Response, NextFunction } from 'express';
import { wrapResult } from '../utils/response/responseWrapper';
import { AuthenticatedRequest } from '../types';
import slaService from './slaService';

class SLAController {
  // ────── Policy CRUD ──────

  public async getPolicies(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, entityType, isActive } = req.query;
      const result = await slaService.getPolicies({
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
        entityType: entityType as string,
        isActive: isActive !== undefined ? isActive === 'true' : undefined
      });
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async createPolicy(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const policy = await slaService.createPolicy(req.body, userId);
      wrapResult(res, policy, 201);
    } catch (error) {
      next(error);
    }
  }

  public async updatePolicy(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id as string);
      const policy = await slaService.updatePolicy(id, req.body);
      wrapResult(res, policy);
    } catch (error) {
      next(error);
    }
  }

  public async deletePolicy(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id as string);
      await slaService.deletePolicy(id);
      wrapResult(res);
    } catch (error) {
      next(error);
    }
  }

  // ────── SLA Status & Metrics ──────

  public async getSLAStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const entityType = req.params.entityType as string;
      const entityId = req.params.entityId as string;
      const status = await slaService.getSLAStatus(entityType, entityId);
      wrapResult(res, status);
    } catch (error) {
      next(error);
    }
  }

  public async getSLAMetrics(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const entityType = req.params.entityType as string;
      const { from, to } = req.query;
      const metrics = await slaService.getSLAMetrics(entityType, {
        from: from as string,
        to: to as string
      });
      wrapResult(res, metrics);
    } catch (error) {
      next(error);
    }
  }

  // ────── SLA Actions ──────

  public async checkBreaches(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await slaService.checkBreaches();
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async pauseSLA(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const entityType = req.params.entityType as string;
      const entityId = req.params.entityId as string;
      const instance = await slaService.pauseSLA(entityType, entityId);
      wrapResult(res, instance);
    } catch (error) {
      next(error);
    }
  }

  public async resumeSLA(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const entityType = req.params.entityType as string;
      const entityId = req.params.entityId as string;
      const instance = await slaService.resumeSLA(entityType, entityId);
      wrapResult(res, instance);
    } catch (error) {
      next(error);
    }
  }
}

export default new SLAController();
