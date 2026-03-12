import { Op } from 'sequelize';
import MeetingNote from './meetingNoteModel';
import User from '../user/userModel';
import { clampPagination } from '../utils/pagination';
import { io } from '../server';

class MeetingNoteService {
  async create(data: Record<string, unknown>, userId: number, tenantId?: string) {
    const note = await MeetingNote.create({ ...data, createdBy: userId, tenantId });
    try {
      io.emit('meetingNote:created', { id: note.id, title: note.title });
    } catch (_ignored: unknown) { /* non-critical */ }
    return this.getById(note.id);
  }

  async getAll(query: Record<string, unknown>, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: Record<string, unknown> = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.type) where.type = query.type;
    if (query.search) {
      where[Op.or] = [{ title: { [Op.iLike]: `%${query.search}%` } }, { minutes: { [Op.iLike]: `%${query.search}%` } }];
    }
    if (query.startDate && query.endDate) {
      where.date = { [Op.between]: [new Date(query.startDate), new Date(query.endDate)] };
    } else if (query.startDate) {
      where.date = { [Op.gte]: new Date(query.startDate) };
    } else if (query.endDate) {
      where.date = { [Op.lte]: new Date(query.endDate) };
    }

    const { rows, count } = await MeetingNote.findAndCountAll({
      where,
      include: [{ model: User, as: 'creator', attributes: ['id', 'name', 'email', 'profilePicture'] }],
      order: [['date', 'DESC']],
      limit,
      offset,
      distinct: true
    });
    return { docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
  }

  async getById(id: string) {
    return MeetingNote.findByPk(id, {
      include: [{ model: User, as: 'creator', attributes: ['id', 'name', 'email', 'profilePicture'] }]
    });
  }

  async update(id: string, data: Record<string, unknown>) {
    const item = await MeetingNote.findByPk(id);
    if (!item) return null;
    await item.update(data);
    try {
      io.emit('meetingNote:updated', { id: item.id, title: item.title });
    } catch (_ignored: unknown) { /* non-critical */ }
    return this.getById(item.id);
  }

  async delete(id: string) {
    const item = await MeetingNote.findByPk(id);
    if (!item) return false;
    await item.destroy();
    try {
      io.emit('meetingNote:deleted', { id });
    } catch (_ignored: unknown) { /* non-critical */ }
    return true;
  }
}

export default new MeetingNoteService();
