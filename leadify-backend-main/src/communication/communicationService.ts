import { Op } from 'sequelize';
import CommActivity, { ActivityType } from './models/activityModel';
import CommCallLog from './models/callLogModel';
import CommMeetingNote from './models/meetingNoteModel';
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
      transcription?: string;
      disposition?: string;
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
      transcription: data.transcription || null,
      disposition: data.disposition || null,
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

    const where: Record<string, any> = {
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
    const where: Record<string, any> = {};
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
    const emailsWeekWhere: Record<string, any> = { ...where };
    delete emailsWeekWhere.createdAt;
    emailsWeekWhere.type = ActivityType.EMAIL;
    emailsWeekWhere.createdAt = { [Op.gte]: weekStart };
    const emailsThisWeek = await CommActivity.count({ where: emailsWeekWhere });

    // Meetings scheduled (upcoming)
    const meetingsWhere: Record<string, any> = { ...where };
    delete meetingsWhere.createdAt;
    meetingsWhere.type = ActivityType.MEETING;
    meetingsWhere.createdAt = { [Op.gte]: todayStart };
    const meetingsScheduled = await CommActivity.count({ where: meetingsWhere });

    // Notes created this week
    const notesWhere: Record<string, any> = { ...where };
    delete notesWhere.createdAt;
    notesWhere.type = ActivityType.NOTE;
    notesWhere.createdAt = { [Op.gte]: weekStart };
    const notesCreated = await CommActivity.count({ where: notesWhere });

    // Tasks this week
    const tasksWhere: Record<string, any> = { ...where };
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

    const prevWhere: Record<string, any> = { ...where };
    delete prevWhere.createdAt;
    prevWhere.createdAt = { [Op.between]: [prevWeekStart, weekStart] };
    const prevTotal = await CommActivity.count({ where: prevWhere });

    const currentWeekWhere: Record<string, any> = { ...where };
    delete currentWeekWhere.createdAt;
    currentWeekWhere.createdAt = { [Op.gte]: weekStart };
    const currentTotal = await CommActivity.count({ where: currentWeekWhere });

    const trend = prevTotal > 0 ? Math.round(((currentTotal - prevTotal) / prevTotal) * 100) : currentTotal > 0 ? 100 : 0;

    // Breakdown by type
    const byType: Record<string, number> = {};
    for (const t of Object.values(ActivityType)) {
      const typeWhere: Record<string, any> = { ...where };
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
    const where: Record<string, any> = { userId };
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

    const updateData: Record<string, any> = {};
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
  ): Promise<IPaginationRes<any>> {
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

    // Enrich with meeting note details
    const activityIds = rows.map(a => a.id);
    let meetingNotesMap: Record<number, CommMeetingNote> = {};
    if (activityIds.length > 0) {
      const meetingNotes = await CommMeetingNote.findAll({
        where: { activityId: { [Op.in]: activityIds } }
      });
      meetingNotesMap = meetingNotes.reduce((map: Record<number, CommMeetingNote>, note) => {
        map[note.activityId] = note;
        return map;
      }, {});
    }

    const enrichedRows = rows.map(activity => {
      const plain = activity.toJSON() as any;
      if (meetingNotesMap[plain.id]) {
        const noteData = meetingNotesMap[plain.id].toJSON();
        plain.title = noteData.title;
        plain.type = noteData.meetingType;
        plain.date = noteData.meetingDate;
        plain.attendees = noteData.attendees;
        plain.minutes = noteData.minutes;
        plain.actionItems = noteData.actionItems;
        plain.attachments = noteData.attachments;
        plain.calendarEventId = noteData.calendarEventId;
        plain.followUps = noteData.followUps;
      }
      return plain;
    });

    return {
      docs: enrichedRows,
      pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) }
    };
  }

  // ─── Create Meeting Note ──────────────────────────────────────────────────
  public async createMeetingNote(
    data: {
      title: string;
      meetingType?: string;
      meetingDate?: string;
      attendees?: Array<{ id?: number; name: string; email?: string; type: string }>;
      minutes?: string;
      actionItems?: Array<{
        task: string;
        assigneeId?: number;
        assigneeName?: string;
        dueDate?: string;
        completed: boolean;
        linkedTaskId?: number;
      }>;
      attachments?: Array<{ name: string; url: string; type: string; size: number }>;
      calendarEventId?: string;
      templateId?: string;
      contactId?: string;
      contactType?: string;
    },
    userId: number,
    tenantId?: string
  ): Promise<{ activity: CommActivity; meetingNote: CommMeetingNote }> {
    // Create activity record
    const activity = await CommActivity.create({
      type: ActivityType.MEETING,
      contactId: data.contactId || 'general',
      contactType: data.contactType || 'CLIENT',
      subject: data.title,
      body: data.minutes || null,
      userId,
      tenantId: tenantId || null
    });

    // Create meeting note record
    const meetingNote = await CommMeetingNote.create({
      activityId: activity.id,
      title: data.title,
      meetingType: data.meetingType || 'INTERNAL',
      meetingDate: data.meetingDate ? new Date(data.meetingDate) : null,
      attendees: data.attendees || [],
      minutes: data.minutes || null,
      actionItems: data.actionItems || [],
      attachments: data.attachments || [],
      calendarEventId: data.calendarEventId || null,
      templateId: data.templateId || null,
      followUps: []
    });

    const fullActivity = await this.getActivityById(activity.id);
    return { activity: fullActivity, meetingNote };
  }

  // ─── Update Meeting Note ──────────────────────────────────────────────────
  public async updateMeetingNote(
    activityId: number,
    data: {
      title?: string;
      meetingType?: string;
      meetingDate?: string;
      attendees?: Array<{ id?: number; name: string; email?: string; type: string }>;
      minutes?: string;
      actionItems?: Array<{
        task: string;
        assigneeId?: number;
        assigneeName?: string;
        dueDate?: string;
        completed: boolean;
        linkedTaskId?: number;
      }>;
      attachments?: Array<{ name: string; url: string; type: string; size: number }>;
      calendarEventId?: string;
      followUps?: Array<{ description: string; dueDate: string; status: string; reminderId?: number }>;
    },
    userId: number
  ): Promise<CommMeetingNote> {
    const activity = await CommActivity.findByPk(activityId);
    if (!activity) throw new BaseError(ERRORS.NOT_FOUND);
    if (activity.userId !== userId) throw new BaseError(ERRORS.ACCESS_DENIED);

    const meetingNote = await CommMeetingNote.findOne({ where: { activityId } });
    if (!meetingNote) throw new BaseError(ERRORS.NOT_FOUND);

    const updateData: Record<string, any> = {};
    if (data.title !== undefined) {
      updateData.title = data.title;
      await activity.update({ subject: data.title });
    }
    if (data.meetingType !== undefined) updateData.meetingType = data.meetingType;
    if (data.meetingDate !== undefined) updateData.meetingDate = data.meetingDate ? new Date(data.meetingDate) : null;
    if (data.attendees !== undefined) updateData.attendees = data.attendees;
    if (data.minutes !== undefined) {
      updateData.minutes = data.minutes;
      await activity.update({ body: data.minutes });
    }
    if (data.actionItems !== undefined) updateData.actionItems = data.actionItems;
    if (data.attachments !== undefined) updateData.attachments = data.attachments;
    if (data.calendarEventId !== undefined) updateData.calendarEventId = data.calendarEventId;
    if (data.followUps !== undefined) updateData.followUps = data.followUps;

    await meetingNote.update(updateData);
    return meetingNote;
  }

  // ─── Delete Meeting Note ──────────────────────────────────────────────────
  public async deleteMeetingNote(activityId: number, userId: number): Promise<void> {
    const activity = await CommActivity.findByPk(activityId);
    if (!activity) throw new BaseError(ERRORS.NOT_FOUND);
    if (activity.userId !== userId) throw new BaseError(ERRORS.ACCESS_DENIED);

    await CommMeetingNote.destroy({ where: { activityId } });
    await activity.destroy();
  }

  // ─── Get Call Analytics ───────────────────────────────────────────────────
  public async getCallAnalytics(
    tenantId: string | null,
    dateRange?: { start?: string; end?: string }
  ): Promise<any> {
    const where: Record<string, any> = { type: ActivityType.CALL };
    if (tenantId) where.tenantId = tenantId;
    if (dateRange?.start && dateRange?.end) {
      where.createdAt = {
        [Op.between]: [new Date(dateRange.start), new Date(dateRange.end)]
      };
    }

    const callActivities = await CommActivity.findAll({
      where,
      attributes: ['id', 'duration', 'direction', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    const activityIds = callActivities.map(a => a.id);
    const callLogs = await CommCallLog.findAll({
      where: { activityId: { [Op.in]: activityIds } },
      attributes: ['activityId', 'outcome', 'disposition', 'duration']
    });

    const callLogsMap = callLogs.reduce((map: Record<number, any>, log) => {
      map[log.activityId] = log.toJSON();
      return map;
    }, {});

    // Duration distribution (0-1min, 1-5min, 5-15min, 15-30min, 30+min)
    const durationBuckets = { '0-1': 0, '1-5': 0, '5-15': 0, '15-30': 0, '30+': 0 };
    callActivities.forEach(call => {
      const minutes = call.duration ? call.duration / 60 : 0;
      if (minutes <= 1) durationBuckets['0-1']++;
      else if (minutes <= 5) durationBuckets['1-5']++;
      else if (minutes <= 15) durationBuckets['5-15']++;
      else if (minutes <= 30) durationBuckets['15-30']++;
      else durationBuckets['30+']++;
    });

    // Calls by outcome
    const byOutcome: Record<string, number> = {};
    callLogs.forEach(log => {
      byOutcome[log.outcome] = (byOutcome[log.outcome] || 0) + 1;
    });

    // Calls by disposition
    const byDisposition: Record<string, number> = {};
    callLogs.forEach(log => {
      if (log.disposition) {
        byDisposition[log.disposition] = (byDisposition[log.disposition] || 0) + 1;
      }
    });

    // Calls by hour of day
    const byHour: Record<number, number> = {};
    for (let h = 0; h < 24; h++) byHour[h] = 0;
    callActivities.forEach(call => {
      const hour = new Date(call.createdAt).getHours();
      byHour[hour]++;
    });

    // Calls by direction
    const byDirection = {
      INBOUND: callActivities.filter(c => c.direction === 'INBOUND').length,
      OUTBOUND: callActivities.filter(c => c.direction === 'OUTBOUND').length
    };

    // Total duration and average
    const totalDuration = callActivities.reduce((sum, c) => sum + (c.duration || 0), 0);
    const avgDuration = callActivities.length > 0 ? totalDuration / callActivities.length : 0;

    // Daily volume trend (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const trendWhere: Record<string, any> = { ...where };
    trendWhere.createdAt = { [Op.gte]: thirtyDaysAgo };

    const trendCalls = await CommActivity.findAll({
      where: trendWhere,
      attributes: ['createdAt'],
      order: [['createdAt', 'ASC']]
    });

    const dailyVolume: Record<string, number> = {};
    trendCalls.forEach(call => {
      const dateKey = new Date(call.createdAt).toISOString().split('T')[0];
      dailyVolume[dateKey] = (dailyVolume[dateKey] || 0) + 1;
    });

    return {
      totalCalls: callActivities.length,
      totalDuration,
      avgDuration: Math.round(avgDuration),
      durationDistribution: durationBuckets,
      byOutcome,
      byDisposition,
      byHour,
      byDirection,
      dailyVolume
    };
  }

  // ─── Search Participants ──────────────────────────────────────────────────
  public async searchParticipants(
    search: string,
    tenantId: string | null,
    limit: number = 10
  ): Promise<Array<{ id: number; name: string; email: string; type: string }>> {
    const where: Record<string, any> = {
      [Op.or]: [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ]
    };
    if (tenantId) where.tenantId = tenantId;

    const users = await User.findAll({
      where,
      attributes: ['id', 'name', 'email'],
      limit: Number(limit)
    });

    return users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      type: 'STAFF'
    }));
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
