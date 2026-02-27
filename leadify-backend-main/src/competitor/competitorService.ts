import { Op } from 'sequelize';
import Competitor from './competitorModel';
import { clampPagination } from '../utils/pagination';

class CompetitorService {
  async create(data: any, tenantId?: string) {
    return Competitor.create({ ...data, tenantId });
  }

  async getAll(query: any, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.status) where.status = query.status;
    if (query.threatLevel) where.threatLevel = query.threatLevel;
    if (query.search) where.name = { [Op.iLike]: `%${query.search}%` };

    const { rows, count } = await Competitor.findAndCountAll({
      where, order: [['createdAt', 'DESC']], limit, offset, distinct: true
    });
    return { docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
  }

  async getById(id: number) {
    return Competitor.findByPk(id);
  }

  async update(id: number, data: any) {
    const item = await Competitor.findByPk(id);
    if (!item) return null;
    await item.update(data);
    return item;
  }

  async delete(id: number) {
    const item = await Competitor.findByPk(id);
    if (!item) return false;
    await item.destroy();
    return true;
  }
}

export default new CompetitorService();
