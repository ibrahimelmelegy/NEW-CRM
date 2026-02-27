import { Op } from 'sequelize';
import CommActivity, { ActivityType } from './models/activityModel';
import CommCallLog from './models/callLogModel';
import User from '../user/userModel';
import { IPaginationRes } from '../types';
import BaseError from '../utils/error/base-http-exception';
import { ERRORS } from '../utils/error/errors';

class CommunicationService {
  // ─── Log Activity ────────────────────────────────────────────────────────
  public async logActivity(
    data: {
      type: string;
      contactId: string;
      contactType: string;
      subject: string;
      body?: string;
      direction?: string;
      duration?: number;
      metadata?: Record<string, any>;
    },
    userId: number,
    tenantId?: string
  ): Promise<CommActivity> {
    const activity = await CommActivity.create({
      type: data.type,
      contactId: data.contactId,
      contactType: data.contactType,
      subject: data.subject,
      body: data.body || null,
      direction: data.direction || null,
      duration: data.duration || null,
      metadata: data.metadata || null,
      userId,
      tenantId: tenantId || null
    });

    return this.getActivityById(activity.id);
  }

  // ─── Log Call ────────────────────────────────────────────────────────────
  public async logCall(
    data: {
      contactId: string;
      contactType: string;
      subject: string;
      body?: string;
      direction?: string;
      phoneNumber: string;
      duration: number;
      outcome: string;
      recordingUrl?: string;
      notes?: string;
      metadata?: Record<string, any>;
    },
    userId: number,
    tenantId?: string
  ): Promise<{ activity: CommActivity; callLog: CommCallLog }> {
    // Create the activity record
    const activity = await CommActivity.create({
      type: ActivityType.CALL,
      contactId: data.contactId,
      contactType: data.contactType,
      subject: data.subject,
      body: data.body || data.notes || null,
      direction: data.direction || null,
      duration: data.duration || 0,
      metadata: data.metadata || null,
      userId,
      tenantId: tenantId || null
    });

    // Create the call log record
    const callLog = await CommCallLog.create({
      activityId: activity.id,
      phoneNumber: data.phoneNumber,
      duration: data.duration || 0,
      outcome: data.outcome,
      recordingUrl: data.recordingUrl || null,
      notes: data.notes || null
    });

    const fullActivity = await this.getActivityById(activity.id);
    return { activity: fullActivity, callLog };
  }

  // ─── Get Timeline ────────────────────────────────────────────────────────
  public async getTimeline(
    contactId: string,
    contactType: string,
    pagination: { page?: number; limit?: number }
  ): Promise<IPaginationRes<CommActivity>> {
    const page = Number(pagination.page) || 1;
    const limit = Number(pagination.limit) || 20;
    const offset = (page - 1) * limit;

    const where: any = {
      contactId,
      contactType
    };

    const { rows, count } = await CommActivity.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'profilePicture']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    // For call activities, also fetch call log details
    const activityIds = rows.filter(a => a.type === ActivityType.CALL).map(a => a.id);

    let callLogsMap: Record<number, CommCallLog> = {};
    if (activityIds.length > 0) {
      const callLogs = await CommCallLog.findAll({
        where: { activityId: { [Op.in]: activityIds } }
      });
      callLogsMap = callLogs.reduce((map: Record<number, CommCallLog>, log) => {
        map[log.activityId] = log;
        return map;
      }, {});
    }

    // Attach call log data to activity metadata for call entries
    const enrichedRows = rows.map(activity => {
      const plain = activity.toJSON() as any;
      if (plain.type === ActivityType.CALL && callLogsMap[plain.id]) {
        plain.callLog = callLogsMap[plain.id].toJSON();
      }
      return plain;
    });

    return {
      docs: enrichedRows as any,
      pagination: {
        page,
        limit,
        totalItems: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  // ─── Get Activity Stats ──────────────────────────────────────────────────
  public async getActivityStats(userId: number | null, tenantId: string | null, dateRange?: { start?: string; end?: string }): Promise<any> {
    const where: any = {};
    if (userId) where.userId = userId;
    if (tenantId) where.tenantId = tenantId;

    // Current period filters
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    if (dateRange?.start && dateRange?.end) {
      where.createdAt = {
        [Op.between]: [new Date(dateRange.start), new Date(dateRange.end)]
      };
    }

    // Total activities
    const totalActivities = await CommActivity.count({ where });

    // Calls today
    const callsTodayWhere = {
      ...where,
      type: ActivityType.CALL,
      createdAt: { [Op.gte]: todayStart }
    };
    // Remove date range override for today's calls
    delete (callsTodayWhere as any).createdAt;
    callsTodayWhere.createdAt = { [Op.gte]: todayStart };
    const callsToday = await CommActivity.count({ where: callsTodayWhere });

    // Emails this week
    const emailsWeekWhere: any = { ...where };
    delete emailsWeekWhere.createdAt;
    emailsWeekWhere.type = ActivityType.EMAIL;
    emailsWeekWhere.createdAt = { [Op.gte]: weekStart };
    const emailsThisWeek = await CommActivity.count({ where: emailsWeekWhere });

    // Meetings scheduled (upcoming)
    const meetingsWhere: any = { ...where };
    delete meetingsWhere.createdAt;
    meetingsWhere.type = ActivityType.MEETING;
    meetingsWhere.createdAt = { [Op.gte]: todayStart };
    const meetingsScheduled = await CommActivity.count({ where: meetingsWhere });

    // Notes created this week
    const notesWhere: any = { ...where };
    delete notesWhere.createdAt;
    notesWhere.type = ActivityType.NOTE;
    notesWhere.createdAt = { [Op.gte]: weekStart };
    const notesCreated = await CommActivity.count({ where: notesWhere });

    // Tasks this week
    const tasksWhere: any = { ...where };
    delete tasksWhere.createdAt;
    tasksWhere.type = ActivityType.TASK;
    tasksWhere.createdAt = { [Op.gte]: weekStart };
    const tasksThisWeek = await CommActivity.count({ where: tasksWhere });

    // Average call duration (seconds)
    const callActivities = await CommActivity.findAll({
      where: {
        ...(userId ? { userId } : {}),
        ...(tenantId ? { tenantId } : {}),
        type: ActivityType.CALL,
        duration: { [Op.gt]: 0 }
      },
      attributes: ['duration']
    });

    let avgCallDuration = 0;
    if (callActivities.length > 0) {
      const totalDuration = callActivities.reduce((sum, a) => sum + (a.duration || 0), 0);
      avgCallDuration = Math.round(totalDuration / callActivities.length);
    }

    // Previous period comparison (last 7 days vs previous 7 days)
    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);

    const prevWhere: any = { ...where };
    delete prevWhere.createdAt;
    prevWhere.createdAt = { [Op.between]: [prevWeekStart, weekStart] };
    const prevTotal = await CommActivity.count({ where: prevWhere });

    const currentWeekWhere: any = { ...where };
    delete currentWeekWhere.createdAt;
    currentWeekWhere.createdAt = { [Op.gte]: weekStart };
    const currentTotal = await CommActivity.count({ where: currentWeekWhere });

    const trend = prevTotal > 0 ? Math.round(((currentTotal - prevTotal) / prevTotal) * 100) : currentTotal > 0 ? 100 : 0;

    // Breakdown by type
    const byType: Record<string, number> = {};
    for (const t of Object.values(ActivityType)) {
      const typeWhere: any = { ...where };
      delete typeWhere.createdAt;
      typeWhere.type = t;
      if (dateRange?.start && dateRange?.end) {
        typeWhere.createdAt = {
          [Op.between]: [new Date(dateRange.start), new Date(dateRange.end)]
        };
      }
      byType[t] = await CommActivity.count({ where: typeWhere });
    }

    return {
      totalActivities,
      callsToday,
      emailsThisWeek,
      meetingsScheduled,
      notesCreated,
      tasksThisWeek,
      avgCallDuration,
      trend,
      byType
    };
  }

  // ─── Get Recent Activities ───────────────────────────────────────────────
  public async getRecentActivities(userId: number, tenantId: string | null, limit: number = 20): Promise<CommActivity[]> {
    const where: any = { userId };
    if (tenantId) where.tenantId = tenantId;

    const activities = await CommActivity.findAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'profilePicture']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit)
    });

    return activities;
  }

  // ─── Update Activity ─────────────────────────────────────────────────────
  public async updateActivity(
    id: number,
    data: {
      subject?: string;
      body?: string;
      direction?: string;
      duration?: number;
      metadata?: Record<string, any>;
    },
    userId: number
  ): Promise<CommActivity> {
    const activity = await CommActivity.findByPk(id);
    if (!activity) throw new BaseError(ERRORS.NOT_FOUND);

    // Only allow the user who created or a super admin to update
    // For now we allow the creator to update
    if (activity.userId !== userId) {
      throw new BaseError(ERRORS.ACCESS_DENIED);
    }

    const updateData: any = {};
    if (data.subject !== undefined) updateData.subject = data.subject;
    if (data.body !== undefined) updateData.body = data.body;
    if (data.direction !== undefined) updateData.direction = data.direction;
    if (data.duration !== undefined) updateData.duration = data.duration;
    if (data.metadata !== undefined) updateData.metadata = data.metadata;

    await activity.update(updateData);
    return this.getActivityById(activity.id);
  }

  // ─── Delete Activity ─────────────────────────────────────────────────────
  public async deleteActivity(id: number, userId: number): Promise<void> {
    const activity = await CommActivity.findByPk(id);
    if (!activity) throw new BaseError(ERRORS.NOT_FOUND);

    if (activity.userId !== userId) {
      throw new BaseError(ERRORS.ACCESS_DENIED);
    }

    // Delete associated call log if it exists
    if (activity.type === ActivityType.CALL) {
      await CommCallLog.destroy({ where: { activityId: id } });
    }

    await activity.destroy();
  }

  // ─── Get All Call Logs ───────────────────────────────────────────────────
  public async getCallLogs(
    tenantId: string | null,
    pagination: { page?: number; limit?: number; search?: string }
  ): Promise<IPaginationRes<any>> {
    const page = Number(pagination.page) || 1;
    const limit = Math.min(100, Math.max(1, Number(pagination.limit) || 20));
    const offset = (page - 1) * limit;

    const where: any = { type: ActivityType.CALL };
    if (tenantId) where.tenantId = tenantId;
    if (pagination.search) {
      where[Op.or] = [
        { subject: { [Op.iLike]: `%${pagination.search}%` } },
        { contactId: { [Op.iLike]: `%${pagination.search}%` } }
      ];
    }

    const { rows, count } = await CommActivity.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'profilePicture'] }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    // Enrich with call log details
    const activityIds = rows.map(a => a.id);
    let callLogsMap: Record<number, CommCallLog> = {};
    if (activityIds.length > 0) {
      const callLogs = await CommCallLog.findAll({
        where: { activityId: { [Op.in]: activityIds } }
      });
      callLogsMap = callLogs.reduce((map: Record<number, CommCallLog>, log) => {
        map[log.activityId] = log;
        return map;
      }, {});
    }

    const enrichedRows = rows.map(activity => {
      const plain = activity.toJSON() as any;
      if (callLogsMap[plain.id]) {
        plain.callLog = callLogsMap[plain.id].toJSON();
      }
      return plain;
    });

    return {
      docs: enrichedRows,
      pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) }
    };
  }

  // ─── Get All Meeting Notes ─────────────────────────────────────────────────
  public async getMeetingNotes(
    tenantId: string | null,
    pagination: { page?: number; limit?: number; search?: string }
  ): Promise<IPaginationRes<CommActivity>> {
    const page = Number(pagination.page) || 1;
    const limit = Math.min(100, Math.max(1, Number(pagination.limit) || 20));
    const offset = (page - 1) * limit;

    const where: any = { type: ActivityType.MEETING };
    if (tenantId) where.tenantId = tenantId;
    if (pagination.search) {
      where[Op.or] = [
        { subject: { [Op.iLike]: `%${pagination.search}%` } },
        { body: { [Op.iLike]: `%${pagination.search}%` } }
      ];
    }

    const { rows, count } = await CommActivity.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'profilePicture'] }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    return {
      docs: rows,
      pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) }
    };
  }

  // ─── Helper: Get Activity By ID ──────────────────────────────────────────
  private async getActivityById(id: number): Promise<CommActivity> {
    const activity = await CommActivity.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'profilePicture']
        }
      ]
    });

    if (!activity) throw new BaseError(ERRORS.NOT_FOUND);
    return activity;
  }
}

export default new CommunicationService();
