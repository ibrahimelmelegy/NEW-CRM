import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { wrapResult } from '../utils/response/responseWrapper';
import communicationService from './communicationService';
import { io } from '../server';

class CommunicationController {
  // ─── Log Activity ────────────────────────────────────────────────────────
  public async logActivity(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.user as any)?.id;
      const tenantId = (req.user as any)?.tenantId;
      const activity = await communicationService.logActivity(req.body, userId, tenantId);
      io.emit('activity:created', {
        id: activity.id,
        type: activity.type,
        contactId: activity.contactId,
        contactType: activity.contactType
      });
      wrapResult(res, activity, 201);
    } catch (error) {
      next(error);
    }
  }

  // ─── Log Call ────────────────────────────────────────────────────────────
  public async logCall(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.user as any)?.id;
      const tenantId = (req.user as any)?.tenantId;
      const result = await communicationService.logCall(req.body, userId, tenantId);
      io.emit('activity:call_logged', {
        id: result.activity.id,
        contactId: result.activity.contactId,
        contactType: result.activity.contactType
      });
      wrapResult(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  // ─── Get Timeline ────────────────────────────────────────────────────────
  public async getTimeline(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { contactType, contactId } = req.params;
      const { page, limit } = req.query;
      const result = await communicationService.getTimeline(contactId as string, contactType as string, {
        page: Number(page) || 1,
        limit: Number(limit) || 20
      });
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  // ─── Get Activity Stats ──────────────────────────────────────────────────
  public async getStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.query.userId ? Number(req.query.userId) : (req.user as any)?.id;
      const tenantId = (req.user as any)?.tenantId || null;
      const dateRange =
        req.query.start && req.query.end
          ? {
              start: req.query.start as string,
              end: req.query.end as string
            }
          : undefined;
      const stats = await communicationService.getActivityStats(userId, tenantId, dateRange);
      wrapResult(res, stats);
    } catch (error) {
      next(error);
    }
  }

  // ─── Get Recent Activities ───────────────────────────────────────────────
  public async getRecent(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.user as any)?.id;
      const tenantId = (req.user as any)?.tenantId || null;
      const limit = Number(req.query.limit) || 20;
      const activities = await communicationService.getRecentActivities(userId, tenantId, limit);
      wrapResult(res, activities);
    } catch (error) {
      next(error);
    }
  }

  // ─── Update Activity ─────────────────────────────────────────────────────
  public async updateActivity(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.user as any)?.id;
      const id = Number(req.params.id);
      const activity = await communicationService.updateActivity(id, req.body, userId);
      io.emit('activity:updated', {
        id: activity.id,
        contactId: activity.contactId,
        contactType: activity.contactType
      });
      wrapResult(res, activity);
    } catch (error) {
      next(error);
    }
  }

  // ─── Get Call Logs ───────────────────────────────────────────────────────
  public async getCallLogs(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req.user as any)?.tenantId || null;
      const result = await communicationService.getCallLogs(tenantId, {
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 20,
        search: req.query.search as string
      });
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  // ─── Get Meeting Notes ─────────────────────────────────────────────────────
  public async getMeetingNotes(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req.user as any)?.tenantId || null;
      const result = await communicationService.getMeetingNotes(tenantId, {
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 20,
        search: req.query.search as string
      });
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  // ─── Create Meeting Note ─────────────────────────────────────────────────
  public async createMeetingNote(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.user as any)?.id;
      const tenantId = (req.user as any)?.tenantId;
      const result = await communicationService.createMeetingNote(req.body, userId, tenantId);
      io.emit('meeting:created', { id: result.activity.id });
      wrapResult(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  // ─── Update Meeting Note ─────────────────────────────────────────────────
  public async updateMeetingNote(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.user as any)?.id;
      const activityId = Number(req.params.id);
      const result = await communicationService.updateMeetingNote(activityId, req.body, userId);
      io.emit('meeting:updated', { id: activityId });
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  // ─── Delete Meeting Note ─────────────────────────────────────────────────
  public async deleteMeetingNote(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.user as any)?.id;
      const activityId = Number(req.params.id);
      await communicationService.deleteMeetingNote(activityId, userId);
      io.emit('meeting:deleted', { id: activityId });
      wrapResult(res, { deleted: true });
    } catch (error) {
      next(error);
    }
  }

  // ─── Get Call Analytics ──────────────────────────────────────────────────
  public async getCallAnalytics(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req.user as any)?.tenantId || null;
      const dateRange =
        req.query.start && req.query.end
          ? { start: req.query.start as string, end: req.query.end as string }
          : undefined;
      const analytics = await communicationService.getCallAnalytics(tenantId, dateRange);
      wrapResult(res, analytics);
    } catch (error) {
      next(error);
    }
  }

  // ─── Search Participants ─────────────────────────────────────────────────
  public async searchParticipants(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req.user as any)?.tenantId || null;
      const search = req.query.search as string || '';
      const limit = Number(req.query.limit) || 10;
      const participants = await communicationService.searchParticipants(search, tenantId, limit);
      wrapResult(res, participants);
    } catch (error) {
      next(error);
    }
  }

  // ─── Delete Activity ─────────────────────────────────────────────────────
  public async deleteActivity(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.user as any)?.id;
      const id = Number(req.params.id);
      await communicationService.deleteActivity(id, userId);
      io.emit('activity:deleted', { id });
      wrapResult(res, { deleted: true });
    } catch (error) {
      next(error);
    }
  }
}

export default new CommunicationController();
