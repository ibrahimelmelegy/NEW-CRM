import { Response, NextFunction } from 'express';
import { wrapResult } from '../utils/response/responseWrapper';
import notificationService from './notificationService';
import notificationCenterService from './notificationCenterService';
import { AuthenticatedRequest } from '../types';
import User from '../user/userModel';

class NotificationController {
  public async getNotifications(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { page, limit, read, type } = req.query;
      const responseFromService = await notificationCenterService.getNotifications(userId, {
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10,
        read: read as string,
        type: type as string
      });
      wrapResult(res, responseFromService);
    } catch (error) {
      next(error);
    }
  }

  public async updateNotificationsToRead(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      await notificationCenterService.markAllAsRead(userId);
      wrapResult(res);
    } catch (error) {
      next(error);
    }
  }

  public async updateNotificationToClicked(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await notificationService.updateNotificationToClicked(req.params.id as string, req.user as User);
      wrapResult(res);
    } catch (error) {
      next(error);
    }
  }

  public async markAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      await notificationCenterService.markAsRead(req.params.id as string, userId);
      wrapResult(res);
    } catch (error) {
      next(error);
    }
  }

  public async getUnreadCount(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const count = await notificationCenterService.getUnreadCount(userId);
      wrapResult(res, { count });
    } catch (error) {
      next(error);
    }
  }

  public async getPreferences(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const preferences = await notificationCenterService.getUserPreferences(userId);
      wrapResult(res, preferences);
    } catch (error) {
      next(error);
    }
  }

  public async updatePreferences(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const preferences = await notificationCenterService.updateUserPreferences(userId, req.body);
      wrapResult(res, preferences);
    } catch (error) {
      next(error);
    }
  }

  public async deleteOldNotifications(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const daysOld = parseInt(req.query.daysOld as string) || 90;
      const deletedCount = await notificationCenterService.deleteOldNotifications(daysOld);
      wrapResult(res, { deletedCount });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get notification digest: unread notifications grouped by type with counts.
   * Query param `since` is an ISO date string; defaults to 24 hours ago.
   */
  public async getDigest(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const sinceParam = req.query.since as string;
      const since = sinceParam ? new Date(sinceParam) : new Date(Date.now() - 24 * 60 * 60 * 1000);
      const digest = await notificationCenterService.getDigest(userId, since);
      wrapResult(res, digest);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Register a browser push subscription for the authenticated user.
   * Body: { endpoint, keys: { p256dh, auth } }
   */
  public async registerPushSubscription(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { endpoint, keys } = req.body;
      if (!endpoint || !keys?.p256dh || !keys?.auth) {
        wrapResult(res, { message: 'Invalid subscription data' }, 400);
        return;
      }
      const result = await notificationCenterService.registerPushSubscription(userId, { endpoint, keys });
      wrapResult(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Unregister a push subscription for the authenticated user.
   * Body: { endpoint }
   */
  public async unregisterPushSubscription(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { endpoint } = req.body;
      if (!endpoint) {
        wrapResult(res, { message: 'Endpoint is required' }, 400);
        return;
      }
      await notificationCenterService.unregisterPushSubscription(userId, endpoint);
      wrapResult(res);
    } catch (error) {
      next(error);
    }
  }
}

export default new NotificationController();
