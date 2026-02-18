import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { wrapResult } from '../utils/response/responseWrapper';
import taskService from './taskService';

class TaskController {
  public async getTasks(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await taskService.getTasks(req.query);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async getMyTasks(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await taskService.getMyTasks(userId, req.query);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async getTaskStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.query.userId ? Number(req.query.userId) : undefined;
      const result = await taskService.getTaskStats(userId);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async getOverdueTasks(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await taskService.getOverdueTasks();
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async getTasksByEntity(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const entityType = req.params.entityType as string;
      const entityId = req.params.entityId as string;
      const result = await taskService.getTasksByEntity(entityType, entityId);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async getTaskById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const result = await taskService.getTaskById(id);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async createTask(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await taskService.createTask(req.body, userId);
      wrapResult(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  public async updateTask(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const userId = req.user!.id;
      const result = await taskService.updateTask(id, req.body, userId);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async completeTask(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const userId = req.user!.id;
      const result = await taskService.completeTask(id, userId);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async deleteTask(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      await taskService.deleteTask(id);
      wrapResult(res, { message: 'Task deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export default new TaskController();
