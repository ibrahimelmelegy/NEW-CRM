import { Response, NextFunction } from 'express';
import { wrapResult } from '../utils/response/responseWrapper';
import calendarService from './calendarService';
import calendarSyncService from './calendarSyncService';
import { AuthenticatedRequest } from '../types';

class CalendarController {
  // ═══════════════════════════════════════════════════════════════════════════
  // EVENT CRUD
  // ═══════════════════════════════════════════════════════════════════════════

  async getEvents(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await calendarService.getEvents(req.query as Record<string, unknown>));
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
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      wrapResult(res, await calendarService.getUpcomingEvents(req.user!.id, limit));
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

  // ─── Entity Events ───────────────────────────────────────────────────────
  async getEventsForEntity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const entityType = req.params.entityType as string;
      const entityId = req.params.entityId as string;
      wrapResult(res, await calendarService.getEventsForEntity(entityType, entityId));
    } catch (error) {
      next(error);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SYNC ENDPOINTS
  // ═══════════════════════════════════════════════════════════════════════════

  // ─── Sync Status ──────────────────────────────────────────────────────────
  async getSyncStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await calendarSyncService.getSyncStatus(req.user!.id));
    } catch (error) {
      next(error);
    }
  }

  // ─── Google OAuth ─────────────────────────────────────────────────────────
  async initiateGoogleAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await calendarSyncService.initiateGoogleAuth(req.user!.id);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  async handleGoogleCallback(req: AuthenticatedRequest, res: Response, _next: NextFunction) {
    try {
      const { code, state } = req.query;
      const userId = state ? Number(state) : req.user!.id;
      await calendarSyncService.handleGoogleCallback(userId, code as string);
      // Redirect to frontend calendar sync settings page after successful auth
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/settings/calendar-sync?provider=google&status=connected`);
    } catch (error) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/settings/calendar-sync?provider=google&status=error&message=${encodeURIComponent((error as Error).message)}`);
    }
  }

  // ─── Outlook OAuth ────────────────────────────────────────────────────────
  async initiateOutlookAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await calendarSyncService.initiateOutlookAuth(req.user!.id);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  async handleOutlookCallback(req: AuthenticatedRequest, res: Response, _next: NextFunction) {
    try {
      const { code, state } = req.query;
      const userId = state ? Number(state) : req.user!.id;
      await calendarSyncService.handleOutlookCallback(userId, code as string);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/settings/calendar-sync?provider=outlook&status=connected`);
    } catch (error) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/settings/calendar-sync?provider=outlook&status=error&message=${encodeURIComponent((error as Error).message)}`);
    }
  }

  // ─── Manual Sync Trigger ──────────────────────────────────────────────────
  async syncNow(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { provider } = req.body;
      let result;

      if (provider === 'google') {
        result = await calendarSyncService.syncFromGoogle(req.user!.id);
      } else if (provider === 'outlook') {
        result = await calendarSyncService.syncFromOutlook(req.user!.id);
      } else {
        result = await calendarSyncService.syncAll(req.user!.id);
      }

      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  // ─── Disconnect Provider ──────────────────────────────────────────────────
  async disconnectProvider(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { provider } = req.params;
      await calendarSyncService.disconnectProvider(req.user!.id, provider as 'google' | 'outlook');
      wrapResult(res, { disconnected: true, provider });
    } catch (error) {
      next(error);
    }
  }

  // ─── Toggle Auto-Sync ────────────────────────────────────────────────────
  async toggleAutoSync(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { provider } = req.params;
      const { enabled } = req.body;
      const result = await calendarSyncService.toggleAutoSync(req.user!.id, provider as 'google' | 'outlook', enabled);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  // ─── Push Event to Provider ───────────────────────────────────────────────
  async pushEventToProvider(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { provider } = req.params;
      const { eventId } = req.body;

      let result;
      if (provider === 'google') {
        result = await calendarSyncService.pushToGoogle(req.user!.id, eventId);
      } else if (provider === 'outlook') {
        result = await calendarSyncService.pushToOutlook(req.user!.id, eventId);
      } else {
        throw new Error('Invalid provider');
      }

      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export default new CalendarController();
