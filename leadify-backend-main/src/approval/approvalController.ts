import { Response, NextFunction } from 'express';
import { wrapResult } from '../utils/response/responseWrapper';
import { AuthenticatedRequest } from '../types';
import approvalService from './approvalService';

class ApprovalController {
  // ---- Workflows ----

  public async getWorkflows(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const workflows = await approvalService.getWorkflows();
      wrapResult(res, workflows);
    } catch (error) {
      next(error);
    }
  }

  public async createWorkflow(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const workflow = await approvalService.createWorkflow(req.body);
      wrapResult(res, workflow, 201);
    } catch (error) {
      next(error);
    }
  }

  public async updateWorkflow(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const workflow = await approvalService.updateWorkflow(parseInt(id), req.body);
      wrapResult(res, workflow);
    } catch (error) {
      next(error);
    }
  }

  public async deleteWorkflow(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      await approvalService.deleteWorkflow(parseInt(id));
      wrapResult(res);
    } catch (error) {
      next(error);
    }
  }

  // ---- Requests ----

  public async getRequests(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, entityType, requesterId, page, limit } = req.query;
      const result = await approvalService.getRequests({
        status: status as string,
        entityType: entityType as string,
        requesterId: requesterId ? parseInt(requesterId as string) : undefined,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20
      });
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async getPendingApprovals(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const pending = await approvalService.getMyPendingApprovals(userId);
      wrapResult(res, pending);
    } catch (error) {
      next(error);
    }
  }

  public async createRequest(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const request = await approvalService.createRequest({ ...req.body, requesterId: userId });
      wrapResult(res, request, 201);
    } catch (error) {
      next(error);
    }
  }

  public async approveStep(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const id = req.params.id as string;
      const { comment } = req.body;
      const result = await approvalService.approveStep(parseInt(id), userId, comment || '');
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async rejectStep(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const id = req.params.id as string;
      const { comment } = req.body;
      const result = await approvalService.rejectStep(parseInt(id), userId, comment || '');
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async cancelRequest(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const id = req.params.id as string;
      const result = await approvalService.cancelRequest(parseInt(id), userId);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export default new ApprovalController();
