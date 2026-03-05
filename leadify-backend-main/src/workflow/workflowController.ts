import { Response, NextFunction } from 'express';
import { wrapResult } from '../utils/response/responseWrapper';
import workflowService from './workflowService';
import { AuthenticatedRequest } from '../types';

class WorkflowController {
  // ── Rule CRUD ──

  async getRules(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await workflowService.getRules(req.query as any);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getRuleById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id as string, 10);
      const result = await workflowService.getRuleById(id);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  async createRule(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const rule = await workflowService.createRule(req.body, userId!);
      wrapResult(res, rule, 201);
    } catch (error) {
      next(error);
    }
  }

  async updateRule(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id as string, 10);
      const rule = await workflowService.updateRule(id, req.body);
      wrapResult(res, rule);
    } catch (error) {
      next(error);
    }
  }

  async deleteRule(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id as string, 10);
      await workflowService.deleteRule(id);
      wrapResult(res, { deleted: true });
    } catch (error) {
      next(error);
    }
  }

  async toggleRule(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id as string, 10);
      const { isActive } = req.body;
      const rule = await workflowService.toggleRule(id, isActive);
      wrapResult(res, rule);
    } catch (error) {
      next(error);
    }
  }

  // ── Test rule with sample data ──

  async testRule(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id as string, 10);
      const sampleData = req.body;
      const result = await workflowService.testRule(id, sampleData);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  // ── Manual execution ──

  async manualExecute(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id as string, 10);
      const userId = req.user!.id;
      const execution = await workflowService.manualExecute(id, userId!);
      wrapResult(res, execution, 201);
    } catch (error) {
      next(error);
    }
  }

  // ── Execution logs ──

  async getExecutions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await workflowService.getExecutions(req.query as any);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getExecutionsForRule(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const ruleId = parseInt(req.params.id as string, 10);
      const result = await workflowService.getExecutionsForRule(ruleId, req.query as any);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getExecutionDetail(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const runId = parseInt(req.params.runId as string, 10);
      const result = await workflowService.getExecutionDetail(runId);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  // ── Templates ──

  async getTemplates(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const templates = workflowService.getTemplates();
      wrapResult(res, templates);
    } catch (error) {
      next(error);
    }
  }
}

export default new WorkflowController();
