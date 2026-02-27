import { Op, fn, col, literal } from 'sequelize';
import CalendarEvent from './calendarEventModel';
import User from '../user/userModel';

class CalendarService {
  // ─── Get Events with Date Range & Filters ─────────────────────────────────
  async getEvents(query: any) {
    const { start, end, userId, eventType, status, priority, search } = query;
    const where: any = {};

    if (start && end) {
      where[Op.or] = [
        { startDate: { [Op.between]: [new Date(start), new Date(end)] } },
        { endDate: { [Op.between]: [new Date(start), new Date(end)] } },
        {
          [Op.and]: [
            { startDate: { [Op.lte]: new Date(start) } },
            { endDate: { [Op.gte]: new Date(end) } }
          ]
        }
      ];
    }
    if (userId) where.userId = userId;
    if (eventType) where.eventType = eventType;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (search) {
      where.title = { [Op.iLike]: `%${search}%` };
    }

    const events = await CalendarEvent.findAll({
      where,
      include: [{ model: User, attributes: ['id', 'name', 'profilePicture'] }],
      order: [['startDate', 'ASC']]
    });

    return events;
  }

  // ─── Create Event ─────────────────────────────────────────────────────────
  async createEvent(data: any, userId: number) {
    return CalendarEvent.create({ ...data, userId });
  }

  // ─── Update Event ─────────────────────────────────────────────────────────
  async updateEvent(id: number, data: any, userId: number) {
    const event = await CalendarEvent.findByPk(id);
    if (!event) throw new Error('Event not found');
    return event.update(data);
  }

  // ─── Delete Event ─────────────────────────────────────────────────────────
  async deleteEvent(id: number) {
    const event = await CalendarEvent.findByPk(id);
    if (!event) throw new Error('Event not found');
    await event.destroy();
    return { deleted: true };
  }

  // ─── Get Event by ID ─────────────────────────────────────────────────────
  async getEventById(id: number) {
    const event = await CalendarEvent.findByPk(id, {
      include: [{ model: User, attributes: ['id', 'name', 'profilePicture'] }]
    });
    if (!event) throw new Error('Event not found');
    return event;
  }

  // ─── Upcoming Events (next 7 days) ───────────────────────────────────────
  async getUpcomingEvents(userId: number) {
    const now = new Date();
    const weekLater = new Date();
    weekLater.setDate(weekLater.getDate() + 7);

    return CalendarEvent.findAll({
      where: {
        userId,
        status: 'SCHEDULED',
        startDate: { [Op.between]: [now, weekLater] }
      },
      include: [{ model: User, attributes: ['id', 'name', 'profilePicture'] }],
      order: [['startDate', 'ASC']],
      limit: 20
    });
  }

  // ─── Today's Agenda ──────────────────────────────────────────────────────
  async getTodayAgenda(userId: number) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    return CalendarEvent.findAll({
      where: {
        userId,
        [Op.or]: [
          { startDate: { [Op.between]: [todayStart, todayEnd] } },
          { endDate: { [Op.between]: [todayStart, todayEnd] } },
          {
            [Op.and]: [
              { startDate: { [Op.lte]: todayStart } },
              { endDate: { [Op.gte]: todayEnd } }
            ]
          }
        ]
      },
      include: [{ model: User, attributes: ['id', 'name', 'profilePicture'] }],
      order: [['startDate', 'ASC']]
    });
  }

  // ─── Conflict Detection ──────────────────────────────────────────────────
  async checkConflicts(userId: number, startDate: string, endDate: string, excludeId?: number) {
    const where: any = {
      userId,
      status: 'SCHEDULED',
      allDay: false,
      [Op.or]: [
        {
          startDate: { [Op.lt]: new Date(endDate) },
          endDate: { [Op.gt]: new Date(startDate) }
        }
      ]
    };

    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }

    return CalendarEvent.findAll({
      where,
      include: [{ model: User, attributes: ['id', 'name', 'profilePicture'] }],
      order: [['startDate', 'ASC']]
    });
  }

  // ─── Update Attendee Status ──────────────────────────────────────────────
  async updateAttendeeStatus(eventId: number, userId: number, status: 'ACCEPTED' | 'DECLINED') {
    const event = await CalendarEvent.findByPk(eventId);
    if (!event) throw new Error('Event not found');

    const attendees = (event.attendees || []).map(a => {
      if (a.userId === userId) {
        return { ...a, status };
      }
      return a;
    });

    return event.update({ attendees });
  }

  // ─── Analytics ────────────────────────────────────────────────────────────
  async getAnalytics(userId: number, startDate?: string, endDate?: string) {
    const where: any = { userId };
    if (startDate && endDate) {
      where.startDate = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    }

    const events = await CalendarEvent.findAll({ where });

    // Event type distribution
    const typeDistribution: Record<string, number> = {};
    events.forEach(e => {
      typeDistribution[e.eventType] = (typeDistribution[e.eventType] || 0) + 1;
    });

    // Status distribution
    const statusDistribution: Record<string, number> = {};
    events.forEach(e => {
      statusDistribution[e.status] = (statusDistribution[e.status] || 0) + 1;
    });

    // Busiest days of week (0=Sun, 6=Sat)
    const dayCount: Record<number, number> = {};
    events.forEach(e => {
      const day = new Date(e.startDate).getDay();
      dayCount[day] = (dayCount[day] || 0) + 1;
    });

    // Meeting hours calculation
    let totalMeetingMinutes = 0;
    events.forEach(e => {
      if (e.eventType === 'MEETING' || e.eventType === 'CALL') {
        const diffMs = new Date(e.endDate).getTime() - new Date(e.startDate).getTime();
        totalMeetingMinutes += Math.max(0, diffMs / 60000);
      }
    });

    // Priority distribution
    const priorityDistribution: Record<string, number> = {};
    events.forEach(e => {
      priorityDistribution[e.priority] = (priorityDistribution[e.priority] || 0) + 1;
    });

    return {
      totalEvents: events.length,
      typeDistribution,
      statusDistribution,
      priorityDistribution,
      busiestDays: dayCount,
      meetingHoursPerWeek: Math.round((totalMeetingMinutes / 60) * 10) / 10,
      scheduledCount: events.filter(e => e.status === 'SCHEDULED').length,
      completedCount: events.filter(e => e.status === 'COMPLETED').length,
      cancelledCount: events.filter(e => e.status === 'CANCELLED').length
    };
  }
}

export default new CalendarService();
