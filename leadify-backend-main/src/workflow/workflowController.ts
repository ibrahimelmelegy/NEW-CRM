import { Response, NextFunction } from 'express';
import { wrapResult } from '../utils/response/responseWrapper';
import workflowService from './workflowService';
import { AuthenticatedRequest } from '../types';

class WorkflowController {
  async getAll(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const workflows = await workflowService.getAll();
      wrapResult(res, workflows);
    } catch (error) { next(error); }
  }

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const workflow = await workflowService.getById(req.params.id as string);
      wrapResult(res, workflow);
    } catch (error) { next(error); }
  }

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const workflow = await workflowService.create(req.body);
      wrapResult(res, workflow, 201);
    } catch (error) { next(error); }
  }

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const workflow = await workflowService.update(req.params.id as string, req.body);
      wrapResult(res, workflow);
    } catch (error) { next(error); }
  }

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await workflowService.delete(req.params.id as string);
      wrapResult(res, { deleted: true });
    } catch (error) { next(error); }
  }

  async getLogs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const logs = await workflowService.getLogs(
        req.query.workflowId as string,
        Number(req.query.limit) || 50
      );
      wrapResult(res, logs);
    } catch (error) { next(error); }
  }
}

export default new WorkflowController();
