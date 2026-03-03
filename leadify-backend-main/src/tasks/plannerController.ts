import { Request, Response, NextFunction } from 'express';
import plannerService from './plannerService';
import { wrapResult } from '../utils/response/responseWrapper';

class PlannerController {
  // Tasks
  async getTasksByDate(req: Request, res: Response, next: NextFunction) {
    try {
      const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
      const result = await plannerService.getTasksByDate((req as any).user.id, date);
      return wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  async createTask(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await plannerService.createTask(req.body, (req as any).user.id);
      return wrapResult(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  async updateTask(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await plannerService.updateTask(Number(req.params.id), req.body, (req as any).user.id);
      return wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  async toggleComplete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await plannerService.toggleComplete(Number(req.params.id), (req as any).user.id);
      return wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  async deleteTask(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await plannerService.deleteTask(Number(req.params.id), (req as any).user.id);
      return wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await plannerService.getStats((req as any).user.id);
      return wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  // Focus
  async startFocus(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await plannerService.startFocus(req.body, (req as any).user.id);
      return wrapResult(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  async endFocus(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await plannerService.endFocus(Number(req.params.id), (req as any).user.id);
      return wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getFocusByDate(req: Request, res: Response, next: NextFunction) {
    try {
      const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
      const result = await plannerService.getFocusByDate((req as any).user.id, date);
      return wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  // Habits
  async getHabits(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await plannerService.getHabits((req as any).user.id);
      return wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  async createHabit(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await plannerService.createHabit(req.body, (req as any).user.id);
      return wrapResult(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  async toggleHabit(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await plannerService.toggleHabit(Number(req.params.id), (req as any).user.id);
      return wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  async deleteHabit(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await plannerService.deleteHabit(Number(req.params.id), (req as any).user.id);
      return wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export default new PlannerController();
