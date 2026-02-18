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
}

export default new NotificationController();
