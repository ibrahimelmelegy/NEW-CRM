import { Response, NextFunction } from 'express';
import plannerService from './plannerService';
import { wrapResult } from '../utils/response/responseWrapper';

import { AuthenticatedRequest } from '../types';
class PlannerController {
  // Tasks
  async getTasksByDate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
      const result = await plannerService.getTasksByDate(req.user!.id, date);
      return wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  async createTask(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await plannerService.createTask(req.body, req.user!.id);
      return wrapResult(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  async updateTask(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await plannerService.updateTask(Number(req.params.id), req.body, req.user!.id);
      return wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  async toggleComplete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await plannerService.toggleComplete(Number(req.params.id), req.user!.id);
      return wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  async deleteTask(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await plannerService.deleteTask(Number(req.params.id), req.user!.id);
      return wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await plannerService.getStats(req.user!.id);
      return wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  // Focus
  async startFocus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await plannerService.startFocus(req.body, req.user!.id);
      return wrapResult(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  async endFocus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await plannerService.endFocus(Number(req.params.id), req.user!.id);
      return wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getFocusByDate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
      const result = await plannerService.getFocusByDate(req.user!.id, date);
      return wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  // Habits
  async getHabits(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await plannerService.getHabits(req.user!.id);
      return wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  async createHabit(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await plannerService.createHabit(req.body, req.user!.id);
      return wrapResult(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  async toggleHabit(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await plannerService.toggleHabit(Number(req.params.id), req.user!.id);
      return wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  async deleteHabit(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await plannerService.deleteHabit(Number(req.params.id), req.user!.id);
      return wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export default new PlannerController();
