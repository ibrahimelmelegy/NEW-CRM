import { Response, NextFunction } from 'express';
import { wrapResult } from '../utils/response/responseWrapper';
import timeTrackingService from './timeTrackingService';
import { AuthenticatedRequest } from '../types';

class TimeTrackingController {
  async startTimer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const entry = await timeTrackingService.startTimer(req.user!.id, req.body);
      wrapResult(res, entry, 201);
    } catch (error) {
      next(error);
    }
  }

  async stopTimer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const entry = await timeTrackingService.stopTimer(req.user!.id);
      wrapResult(res, entry);
    } catch (error) {
      next(error);
    }
  }

  async getRunningTimer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const entry = await timeTrackingService.getRunningTimer(req.user!.id);
      wrapResult(res, entry);
    } catch (error) {
      next(error);
    }
  }

  async getEntries(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await timeTrackingService.getEntries(req.user!.id, req.query as Record<string, string>);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  async createManualEntry(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const entry = await timeTrackingService.createManualEntry(req.user!.id, req.body);
      wrapResult(res, entry, 201);
    } catch (error) {
      next(error);
    }
  }

  async updateEntry(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const entry = await timeTrackingService.updateEntry(req.params.id as string, req.user!.id, req.body);
      wrapResult(res, entry);
    } catch (error) {
      next(error);
    }
  }

  async deleteEntry(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await timeTrackingService.deleteEntry(req.params.id as string, req.user!.id);
      wrapResult(res, { deleted: true });
    } catch (error) {
      next(error);
    }
  }

  async getWeeklySummary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await timeTrackingService.getWeeklySummary(req.user!.id, req.query.weekStart as string);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export default new TimeTrackingController();
