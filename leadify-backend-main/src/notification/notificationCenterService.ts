import { Op, fn, col } from 'sequelize';
import jwt from 'jsonwebtoken';
import Notification from './notificationModel';
import NotificationPreference, {
  DEFAULT_NOTIFICATION_PREFERENCES,
  NotificationChannels,
  NotificationPreferencesMap
} from './notificationPreferenceModel';
import { NotificationReadEnums, NotificationTypeEnums, NotificationPriorityEnum, TYPE_PRIORITY_MAP } from './notificationEnum';
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
      // eslint-disable-next-line @typescript-eslint/no-require-imports
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
  priority?: NotificationPriorityEnum;
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
    SYSTEM_ALERT: 'system_alert',
    [NotificationTypeEnums.DOCUMENT_APPROVAL_REQUESTED]: 'document_approval_requested',
    [NotificationTypeEnums.DOCUMENT_APPROVED]: 'document_approved',
    [NotificationTypeEnums.DOCUMENT_REJECTED]: 'document_rejected'
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
   * Priority is resolved from the explicit `data.priority`, the type-based default,
   * or falls back to MEDIUM. CRITICAL priority always triggers email regardless
   * of user preferences.
   * Returns the created Notification (or null if inApp is disabled).
   */
  async sendNotification(data: SendNotificationData): Promise<Notification | null> {
    const channels = await this.getChannelPrefs(data.userId, data.type);
    const priority = data.priority || TYPE_PRIORITY_MAP[data.type] || NotificationPriorityEnum.MEDIUM;
    const isCritical = priority === NotificationPriorityEnum.CRITICAL;

    let notification: Notification | null = null;

    // In-app notification (always create for CRITICAL, otherwise respect preference)
    if (channels.inApp || isCritical) {
      notification = await Notification.create({
        userId: data.userId,
        body_en: data.message,
        body_ar: data.message,
        type: data.type,
        title: data.title,
        target: data.actionUrl || data.entityId || null,
        read: NotificationReadEnums.UN_READ,
        priority,
        entityType: data.entityType || null,
        entityId: data.entityId || null
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
            priority,
            entityType: data.entityType,
            entityId: data.entityId,
            actionUrl: data.actionUrl,
            createdAt: notification.createdAt
          }
        });
      }
    }

    // Email notification — CRITICAL always sends email regardless of preferences
    const shouldSendEmail = isCritical || (channels.email && canSendEmail(data.userId));
    if (shouldSendEmail) {
      try {
        const user = await User.findByPk(data.userId);
        if (user?.email) {
          const secret = process.env.SECRET_KEY;
          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3060';
          const actionUrl = data.actionUrl ? `${frontendUrl}${data.actionUrl}` : undefined;
          let unsubscribeUrl: string | undefined;
          if (secret) {
            const prefKey = typeToPreferenceKey(data.type);
            const unsubscribeToken = jwt.sign({ userId: data.userId, notificationType: prefKey }, secret, { expiresIn: '30d' });
            unsubscribeUrl = `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/notification/unsubscribe?token=${unsubscribeToken}`;
          } else {
            console.error('[NotificationCenter] SECRET_KEY not set — omitting unsubscribe link');
          }

          const priorityPrefix = isCritical ? '[CRITICAL] ' : priority === NotificationPriorityEnum.HIGH ? '[HIGH] ' : '';
          const html = renderNotificationEmail({
            type: data.type,
            title: `${priorityPrefix}${data.title}`,
            message: data.message,
            actionUrl,
            unsubscribeUrl
          });

          await sendEmail({
            to: user.email,
            subject: `${priorityPrefix}${data.title}`,
            text: data.message,
            html
          });
        }
      } catch (emailError) {
        console.error('Failed to send notification email:', emailError);
      }
    }

    // Push notification via web-push (when user has a registered subscription)
    if (channels.push || isCritical) {
      try {
        await this.sendWebPush(data.userId, data.title, data.message, data.actionUrl);
      } catch (pushError) {
        // Silent failure — push is best-effort
        console.error('Failed to send push notification:', pushError);
      }
    }

    return notification;
  }

  /**
   * Send a web push notification to a user if they have a registered subscription.
   * Uses the web-push library with VAPID keys from environment variables.
   * Silently skips if web-push is not installed or no subscription is found.
   */
  private async sendWebPush(userId: number, title: string, message: string, actionUrl?: string): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const webpush = require('web-push');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const PushSubscription = require('./pushSubscriptionModel').default;

      const vapidPublic = process.env.VAPID_PUBLIC_KEY;
      const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
      const vapidEmail = process.env.VAPID_EMAIL || 'mailto:admin@leadify.com';

      if (!vapidPublic || !vapidPrivate) return;

      webpush.setVapidDetails(vapidEmail, vapidPublic, vapidPrivate);

      const subscriptions = await PushSubscription.findAll({ where: { userId } });
      if (!subscriptions || subscriptions.length === 0) return;

      const payload = JSON.stringify({
        title,
        body: message,
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        data: { actionUrl: actionUrl || '/' }
      });

      for (const sub of subscriptions) {
        try {
          await webpush.sendNotification(sub.subscription, payload);
        } catch (err) {
          // If subscription expired (410 Gone), remove it
          if ((err as any)?.statusCode === 410) {
            await sub.destroy();
          }
        }
      }
    } catch {
      // web-push not installed or PushSubscription model not available — skip silently
    }
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

    const where: Record<string, any> = { userId };

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
   * Delete a single notification for a user.
   */
  async deleteNotification(id: string, userId: number): Promise<void> {
    const notification = await Notification.findOne({ where: { id, userId } });
    if (!notification) throw new BaseError(ERRORS.NOTIFICATION_NOT_FOUND);
    await notification.destroy();
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

  /**
   * Get a notification digest for a user since a given date.
   * Returns unread notifications grouped by type with counts and latest messages.
   */
  async getDigest(
    userId: number,
    since: Date
  ): Promise<{
    totalUnread: number;
    groups: { type: string; count: number; priority: string; latestMessage: string; latestAt: Date }[];
    oldestUnread: Date | null;
  }> {
    // Get counts grouped by type
    const groupRows = (await Notification.findAll({
      where: {
        userId,
        read: NotificationReadEnums.UN_READ,
        createdAt: { [Op.gte]: since }
      },
      attributes: ['type', 'priority', [fn('COUNT', col('id')), 'count'], [fn('MAX', col('createdAt')), 'latestAt']],
      group: ['type', 'priority'],
      raw: true,
      order: [[fn('MAX', col('createdAt')), 'DESC']]
    })) as any[];

    // Get the latest message per type for preview
    const groups: { type: string; count: number; priority: string; latestMessage: string; latestAt: Date }[] = [];

    for (const row of groupRows) {
      // Fetch the latest notification of this type for the preview
      const latest = await Notification.findOne({
        where: {
          userId,
          type: row.type,
          read: NotificationReadEnums.UN_READ,
          createdAt: { [Op.gte]: since }
        },
        order: [['createdAt', 'DESC']],
        attributes: ['body_en']
      });

      groups.push({
        type: row.type,
        count: Number(row.count) || 0,
        priority: row.priority || NotificationPriorityEnum.MEDIUM,
        latestMessage: latest?.body_en || '',
        latestAt: new Date(row.latestAt)
      });
    }

    const totalUnread = groups.reduce((sum, g) => sum + g.count, 0);

    // Oldest unread notification date
    const oldest = await Notification.findOne({
      where: {
        userId,
        read: NotificationReadEnums.UN_READ,
        createdAt: { [Op.gte]: since }
      },
      order: [['createdAt', 'ASC']],
      attributes: ['createdAt']
    });

    return {
      totalUnread,
      groups,
      oldestUnread: oldest ? oldest.createdAt : null
    };
  }

  /**
   * Send batch/collapsed notifications. If multiple notifications of the same type
   * are pending for a user within a time window, collapse them into a single notification.
   * E.g., "You have 5 new lead assignments" instead of 5 separate notifications.
   *
   * @param notifications Array of notification data to send
   * @param collapseWindowMinutes Time window to check for existing pending notifications (default 30 min)
   */
  async sendBatchNotifications(notifications: SendNotificationData[], collapseWindowMinutes: number = 30): Promise<(Notification | null)[]> {
    // Group notifications by userId + type
    const grouped = new Map<string, SendNotificationData[]>();
    for (const n of notifications) {
      const key = `${n.userId}:${n.type}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(n);
    }

    const results: (Notification | null)[] = [];
    const windowStart = new Date(Date.now() - collapseWindowMinutes * 60 * 1000);

    for (const [_key, group] of grouped) {
      const { userId, type } = group[0];

      // Check how many unread notifications of the same type exist within the window
      const existingCount = await Notification.count({
        where: {
          userId,
          type,
          read: NotificationReadEnums.UN_READ,
          createdAt: { [Op.gte]: windowStart }
        }
      });

      const totalCount = existingCount + group.length;

      if (totalCount > 1 && group.length > 1) {
        // Collapse: send one summary notification instead of many
        const typeLabel = type.replace(/_/g, ' ').toLowerCase();
        const collapsedData: SendNotificationData = {
          userId,
          type,
          title: group[0].title,
          message: `You have ${totalCount} new ${typeLabel} notifications.`,
          entityType: group[0].entityType,
          actionUrl: group[0].actionUrl,
          priority: group[0].priority
        };

        const result = await this.sendNotification(collapsedData);
        results.push(result);
      } else {
        // Send individually — not enough to collapse
        for (const n of group) {
          const result = await this.sendNotification(n);
          results.push(result);
        }
      }
    }

    return results;
  }

  /**
   * Register a push subscription for a user.
   * Stores the browser push subscription object for web push notifications.
   */
  async registerPushSubscription(userId: number, subscription: { endpoint: string; keys: { p256dh: string; auth: string } }): Promise<any> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const PushSubscription = require('./pushSubscriptionModel').default;

      // Upsert: if same endpoint exists, update; otherwise create
      const existing = await PushSubscription.findOne({
        where: { userId, endpoint: subscription.endpoint }
      });

      if (existing) {
        await existing.update({ subscription });
        return existing;
      }

      return await PushSubscription.create({
        userId,
        endpoint: subscription.endpoint,
        subscription
      });
    } catch {
      // PushSubscription model not available — skip silently
      return null;
    }
  }

  /**
   * Unregister a push subscription for a user.
   */
  async unregisterPushSubscription(userId: number, endpoint: string): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const PushSubscription = require('./pushSubscriptionModel').default;
      await PushSubscription.destroy({ where: { userId, endpoint } });
    } catch {
      // Model not available — skip silently
    }
  }
}

export default new NotificationCenterService();
