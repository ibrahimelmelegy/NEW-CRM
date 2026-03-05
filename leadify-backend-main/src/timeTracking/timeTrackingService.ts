import { Op } from 'sequelize';
import TimeEntry from './timeEntryModel';
import User from '../user/userModel';
import { clampPagination } from '../utils/pagination';

class TimeTrackingService {
  async startTimer(userId: number, data: { entityType?: string; entityId?: string; entityName?: string; description?: string }) {
    // Stop any running timer first
    const running = await TimeEntry.findOne({
      where: { userId, endTime: null }
    });
    if (running) {
      await this.stopTimer(userId);
    }

    return TimeEntry.create({
      userId,
      entityType: data.entityType,
      entityId: data.entityId,
      entityName: data.entityName,
      description: data.description,
      startTime: new Date()
    });
  }

  async stopTimer(userId: number) {
    const running = await TimeEntry.findOne({
      where: { userId, endTime: null }
    });
    if (!running) throw new Error('No running timer');

    const endTime = new Date();
    const duration = Math.round((endTime.getTime() - new Date(running.startTime).getTime()) / 1000);

    await running.update({ endTime, duration });
    return running;
  }

  async getRunningTimer(userId: number) {
    return TimeEntry.findOne({
      where: { userId, endTime: null }
    });
  }

  async getEntries(userId: number, query: { startDate?: string; endDate?: string; entityType?: string; page?: number; limit?: number }) {
    const { page, limit, offset } = clampPagination(query, 50);
    const where: Record<string, any> = { userId };

    if (query.startDate) where.startTime = { [Op.gte]: new Date(query.startDate) };
    if (query.endDate) {
      where.startTime = { ...where.startTime, [Op.lte]: new Date(query.endDate) };
    }
    if (query.entityType) where.entityType = query.entityType;

    const { rows, count } = await TimeEntry.findAndCountAll({
      where,
      order: [['startTime', 'DESC']],
      limit,
      offset,
      include: [{ model: User, attributes: ['id', 'name', 'profilePicture'] }]
    });

    return { entries: rows, total: count, page, limit };
  }

  async createManualEntry(userId: number, data: any) {
    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);
    const duration = Math.round((endTime.getTime() - startTime.getTime()) / 1000);

    return TimeEntry.create({
      userId,
      entityType: data.entityType,
      entityId: data.entityId,
      entityName: data.entityName,
      description: data.description,
      startTime,
      endTime,
      duration
    });
  }

  async updateEntry(id: string, userId: number, data: any) {
    const entry = await TimeEntry.findOne({ where: { id, userId } });
    if (!entry) throw new Error('Time entry not found');

    if (data.startTime && data.endTime) {
      data.duration = Math.round((new Date(data.endTime).getTime() - new Date(data.startTime).getTime()) / 1000);
    }

    return entry.update(data);
  }

  async deleteEntry(id: string, userId: number) {
    const entry = await TimeEntry.findOne({ where: { id, userId } });
    if (!entry) throw new Error('Time entry not found');
    await entry.destroy();
  }

  async getWeeklySummary(userId: number, weekStart: string) {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    const entries = await TimeEntry.findAll({
      where: {
        userId,
        startTime: { [Op.gte]: start, [Op.lt]: end },
        endTime: { [Op.ne]: null }
      },
      order: [['startTime', 'ASC']]
    });

    // Group by day
    const days: Record<string, number> = {};
    for (const entry of entries) {
      const day = new Date(entry.startTime).toISOString().split('T')[0];
      days[day] = (days[day] || 0) + (entry.duration || 0);
    }

    const totalSeconds = Object.values(days).reduce((sum, d) => sum + d, 0);

    return { entries, dailyTotals: days, totalSeconds };
  }
}

export default new TimeTrackingService();
