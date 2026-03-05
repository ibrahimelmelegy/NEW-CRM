import { Request, Response, NextFunction } from 'express';
import { wrapResult } from '../utils/response/responseWrapper';
import calendarService from './calendarService';
import { AuthenticatedRequest } from '../types';

class CalendarController {
  async getEvents(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await calendarService.getEvents(req.query));
    } catch (error) {
      next(error);
    }
  }

  async createEvent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await calendarService.createEvent(req.body, req.user!.id), 201);
    } catch (error) {
      next(error);
    }
  }

  async updateEvent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await calendarService.updateEvent(Number(req.params.id), req.body, req.user!.id));
    } catch (error) {
      next(error);
    }
  }

  async deleteEvent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await calendarService.deleteEvent(Number(req.params.id)));
    } catch (error) {
      next(error);
    }
  }

  async getEventById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await calendarService.getEventById(Number(req.params.id)));
    } catch (error) {
      next(error);
    }
  }

  async getUpcomingEvents(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await calendarService.getUpcomingEvents(req.user!.id));
    } catch (error) {
      next(error);
    }
  }

  async getTodayAgenda(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await calendarService.getTodayAgenda(req.user!.id));
    } catch (error) {
      next(error);
    }
  }

  async checkConflicts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate, excludeId } = req.query;
      wrapResult(
        res,
        await calendarService.checkConflicts(req.user!.id, startDate as string, endDate as string, excludeId ? Number(excludeId) : undefined)
      );
    } catch (error) {
      next(error);
    }
  }

  async updateAttendeeStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { status } = req.body;
      wrapResult(res, await calendarService.updateAttendeeStatus(Number(req.params.id), req.user!.id, status));
    } catch (error) {
      next(error);
    }
  }

  async getAnalytics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;
      wrapResult(res, await calendarService.getAnalytics(req.user!.id, startDate as string | undefined, endDate as string | undefined));
    } catch (error) {
      next(error);
    }
  }
}

export default new CalendarController();
