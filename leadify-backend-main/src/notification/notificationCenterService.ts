import { Op } from 'sequelize';
import jwt from 'jsonwebtoken';
import Notification from './notificationModel';
import NotificationPreference, {
  DEFAULT_NOTIFICATION_PREFERENCES,
  NotificationChannels,
  NotificationPreferencesMap
} from './notificationPreferenceModel';
import { NotificationReadEnums, NotificationTypeEnums } from './notificationEnum';
import { renderNotificationEmail } from './notificationEmailTemplates';
import { sendEmail } from '../utils/emailHelper';
import User from '../user/userModel';
import Role from '../role/roleModel';
import BaseError from '../utils/error/base-http-exception';
import { ERRORS } from '../utils/error/errors';
import { SortEnum } from '../lead/leadEnum';

// Simple in-memory throttle: max 10 notification emails per user per hour
const emailThrottle: Map<number, number[]> = new Map();
const EMAIL_THROTTLE_LIMIT = 10;
const EMAIL_THROTTLE_WINDOW = 60 * 60 * 1000; // 1 hour

function canSendEmail(userId: number): boolean {
  const now = Date.now();
  const timestamps = emailThrottle.get(userId) || [];
  const recent = timestamps.filter(t => now - t < EMAIL_THROTTLE_WINDOW);
  emailThrottle.set(userId, recent);
  if (recent.length >= EMAIL_THROTTLE_LIMIT) return false;
  recent.push(now);
  return true;
}

let ioInstance: any = null;

function getIO() {
  if (!ioInstance) {
    try {
      ioInstance = require('../server').io;
    } catch {
      // Socket.io not available (e.g. in tests)
    }
  }
  return ioInstance;
}

export interface SendNotificationData {
  userId: number;
  type: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
}

interface GetNotificationsQuery {
  page?: number;
  limit?: number;
  read?: string;
  type?: string;
}

/**
 * Maps notification type strings to the preference key used in notification_preferences.
 * Falls back to the lowercase type if no explicit mapping is found.
 */
function typeToPreferenceKey(type: string): string {
  const mapping: Record<string, string> = {
    [NotificationTypeEnums.LEAD_ASSIGNED]: 'lead_assigned',
    [NotificationTypeEnums.OPPORTUNITY_ASSIGNED]: 'opportunity_assigned',
    [NotificationTypeEnums.DEAL_ASSIGNED]: 'deal_assigned',
    [NotificationTypeEnums.PROJECT_ASSIGNED]: 'project_assigned',
    [NotificationTypeEnums.CLIENT_ASSIGNED]: 'client_assigned',
    [NotificationTypeEnums.PROPOSAL_APPROVED]: 'proposal_approved',
    [NotificationTypeEnums.PROPOSAL_REJECTED]: 'proposal_rejected',
    [NotificationTypeEnums.PROPOSAL_ASSIGNED]: 'proposal_assigned',
    DEAL_WON: 'deal_won',
    TASK_DUE: 'task_due',
    APPROVAL_REQUESTED: 'approval_requested',
    COMMENT_MENTION: 'comment_mention',
    WORKFLOW_TRIGGERED: 'workflow_triggered',
    SLA_BREACH: 'sla_breach',
    SLA_WARNING: 'sla_warning',
    INVOICE_OVERDUE: 'invoice_overdue',
    CONTRACT_EXPIRING: 'contract_expiring',
    SYSTEM_ALERT: 'system_alert'
  };
  return mapping[type] || type.toLowerCase();
}

class NotificationCenterService {
  /**
   * Get a user's notification channel preferences for a given type.
   * Returns the channel config or a default (all inApp enabled).
   */
  private async getChannelPrefs(userId: number, type: string): Promise<NotificationChannels> {
    const pref = await NotificationPreference.findOne({ where: { userId } });
    const prefsMap: NotificationPreferencesMap = pref ? pref.preferences : DEFAULT_NOTIFICATION_PREFERENCES;

    const key = typeToPreferenceKey(type);
    return prefsMap[key] || { inApp: true, email: false, push: false };
  }

  /**
   * Send a notification to a single user, respecting their preferences.
   * Returns the created Notification (or null if inApp is disabled).
   */
  async sendNotification(data: SendNotificationData): Promise<Notification | null> {
    const channels = await this.getChannelPrefs(data.userId, data.type);

    let notification: Notification | null = null;

    // In-app notification
    if (channels.inApp) {
      notification = await Notification.create({
        userId: data.userId,
        body_en: data.message,
        body_ar: data.message,
        type: data.type,
        target: data.actionUrl || data.entityId || null,
        read: NotificationReadEnums.UN_READ
      });

      // Emit real-time event via Socket.io
      const io = getIO();
      if (io) {
        io.emit('notification:new', {
          userId: data.userId,
          notification: {
            id: notification.id,
            type: data.type,
            title: data.title,
            message: data.message,
            entityType: data.entityType,
            entityId: data.entityId,
            actionUrl: data.actionUrl,
            createdAt: notification.createdAt
          }
        });
      }
    }

    // Email notification via Brevo
    if (channels.email && canSendEmail(data.userId)) {
      try {
        const user = await User.findByPk(data.userId);
        if (user?.email) {
          const secret = process.env.SECRET_KEY || 'default-secret';
          const prefKey = typeToPreferenceKey(data.type);
          const unsubscribeToken = jwt.sign(
            { userId: data.userId, notificationType: prefKey },
            secret,
            { expiresIn: '30d' }
          );
          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3060';
          const unsubscribeUrl = `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/notifications/unsubscribe?token=${unsubscribeToken}`;
          const actionUrl = data.actionUrl ? `${frontendUrl}${data.actionUrl}` : undefined;

          const html = renderNotificationEmail({
            type: data.type,
            title: data.title,
            message: data.message,
            actionUrl,
            unsubscribeUrl
          });

          await sendEmail({
            to: user.email,
            subject: data.title,
            text: data.message,
            html
          });
        }
      } catch (emailError) {
        console.error('Failed to send notification email:', emailError);
      }
    }

    // Push notification (placeholder - integrate with your push provider)
    if (channels.push) {
      // TODO: Integrate with push service (e.g. Firebase Cloud Messaging, OneSignal)
      // await pushService.send({ userId, title: data.title, body: data.message });
    }

    return notification;
  }

  /**
   * Send a notification to multiple users.
   */
  async sendBulkNotification(userIds: number[], data: Omit<SendNotificationData, 'userId'>): Promise<(Notification | null)[]> {
    const results: (Notification | null)[] = [];
    for (const userId of userIds) {
      const notification = await this.sendNotification({ ...data, userId });
      results.push(notification);
    }
    return results;
  }

  /**
   * Send a notification to all users that have a specific role.
   */
  async sendRoleNotification(roleName: string, data: Omit<SendNotificationData, 'userId'>): Promise<(Notification | null)[]> {
    const role = await Role.findOne({ where: { name: roleName } });
    if (!role) return [];

    const users = await User.findAll({ where: { roleId: role.id } });
    const userIds = users.map(u => u.id);

    return this.sendBulkNotification(userIds, data);
  }

  /**
   * Get paginated notifications for a user, with optional filters.
   */
  async getNotifications(
    userId: number,
    query: GetNotificationsQuery
  ): Promise<{
    unreadNotificationsCount: number;
    docs: Notification[];
    pagination: { page: number; limit: number; totalItems: number; totalPages: number };
  }> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const offset = (page - 1) * limit;

    const where: any = { userId };

    // Filter by read status
    if (query.read === 'unread') {
      where.read = NotificationReadEnums.UN_READ;
    } else if (query.read === 'read') {
      where.read = { [Op.in]: [NotificationReadEnums.READ, NotificationReadEnums.CLICKED] };
    }

    // Filter by type
    if (query.type) {
      where.type = query.type;
    }

    const { rows: notifications, count: totalItems } = await Notification.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', SortEnum.DESC]]
    });

    const unreadNotificationsCount = await Notification.count({
      where: { userId, read: NotificationReadEnums.UN_READ }
    });

    return {
      unreadNotificationsCount,
      docs: notifications,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit)
      }
    };
  }

  /**
   * Mark a single notification as read.
   */
  async markAsRead(id: string, userId: number): Promise<void> {
    const notification = await Notification.findOne({ where: { id, userId } });
    if (!notification) throw new BaseError(ERRORS.NOTIFICATION_NOT_FOUND);

    notification.read = NotificationReadEnums.READ;
    await notification.save();
  }

  /**
   * Mark all unread notifications as read for a user.
   */
  async markAllAsRead(userId: number): Promise<void> {
    await Notification.update({ read: NotificationReadEnums.READ }, { where: { userId, read: NotificationReadEnums.UN_READ } });
  }

  /**
   * Get the count of unread notifications for a user.
   */
  async getUnreadCount(userId: number): Promise<number> {
    return Notification.count({
      where: { userId, read: NotificationReadEnums.UN_READ }
    });
  }

  /**
   * Get a user's notification preferences. Creates defaults if none exist.
   */
  async getUserPreferences(userId: number): Promise<NotificationPreference> {
    let pref = await NotificationPreference.findOne({ where: { userId } });
    if (!pref) {
      pref = await NotificationPreference.create({
        userId,
        preferences: DEFAULT_NOTIFICATION_PREFERENCES
      });
    }
    return pref;
  }

  /**
   * Update a user's notification preferences (partial merge).
   */
  async updateUserPreferences(userId: number, preferences: Partial<NotificationPreferencesMap>): Promise<NotificationPreference> {
    let pref = await NotificationPreference.findOne({ where: { userId } });
    if (!pref) {
      pref = await NotificationPreference.create({
        userId,
        preferences: { ...DEFAULT_NOTIFICATION_PREFERENCES, ...preferences }
      });
    } else {
      // Merge existing preferences with new ones
      const merged = { ...pref.preferences, ...preferences };
      await pref.update({ preferences: merged });
    }
    return pref;
  }

  /**
   * Delete notifications older than the specified number of days.
   * Returns the number of deleted notifications.
   */
  async deleteOldNotifications(daysOld: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const deleted = await Notification.destroy({
      where: {
        createdAt: { [Op.lt]: cutoffDate }
      }
    });

    return deleted;
  }
}

export default new NotificationCenterService();
