import { Op } from 'sequelize';
import CalendarEvent from './calendarEventModel';
import User from '../user/userModel';

class CalendarService {
  async getEvents(query: any) {
    const { start, end, userId, eventType } = query;
    const where: any = {};

    if (start && end) {
      where.startDate = { [Op.between]: [new Date(start), new Date(end)] };
    }
    if (userId) where.userId = userId;
    if (eventType) where.eventType = eventType;

    return CalendarEvent.findAll({
      where,
      include: [{ model: User, attributes: ['id', 'name', 'profilePicture'] }],
      order: [['startDate', 'ASC']]
    });
  }

  async createEvent(data: any, userId: number) {
    return CalendarEvent.create({ ...data, userId });
  }

  async updateEvent(id: number, data: any, userId: number) {
    const event = await CalendarEvent.findByPk(id);
    if (!event) throw new Error('Event not found');
    return event.update(data);
  }

  async deleteEvent(id: number) {
    const event = await CalendarEvent.findByPk(id);
    if (!event) throw new Error('Event not found');
    await event.destroy();
    return { deleted: true };
  }

  async getEventById(id: number) {
    const event = await CalendarEvent.findByPk(id, {
      include: [{ model: User, attributes: ['id', 'name', 'profilePicture'] }]
    });
    if (!event) throw new Error('Event not found');
    return event;
  }
}

export default new CalendarService();
