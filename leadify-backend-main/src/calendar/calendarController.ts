import { Request, Response, NextFunction } from 'express';
import { wrapResult } from '../utils/response/responseWrapper';
import calendarService from './calendarService';
import { AuthenticatedRequest } from '../types';

class CalendarController {
  async getEvents(req: Request, res: Response, next: NextFunction) {
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

  async deleteEvent(req: Request, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await calendarService.deleteEvent(Number(req.params.id)));
    } catch (error) {
      next(error);
    }
  }

  async getEventById(req: Request, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await calendarService.getEventById(Number(req.params.id)));
    } catch (error) {
      next(error);
    }
  }
}

export default new CalendarController();
