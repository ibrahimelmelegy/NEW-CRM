import { Op } from 'sequelize';
import Goal from './goalModel';
import { clampPagination } from '../utils/pagination';

class GoalService {
  async create(data: any, tenantId?: string) {
    return Goal.create({ ...data, tenantId });
  }

  async getAll(query: any, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.level) where.level = query.level;
    if (query.status) where.status = query.status;
    if (query.owner) where.owner = { [Op.iLike]: `%${query.owner}%` };
    if (query.search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${query.search}%` } },
        { description: { [Op.iLike]: `%${query.search}%` } }
      ];
    }

    const { rows, count } = await Goal.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit, offset, distinct: true
    });
    return { docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
  }

  async getById(id: number) {
    return Goal.findByPk(id);
  }

  async update(id: number, data: any) {
    const goal = await Goal.findByPk(id);
    if (!goal) return null;
    await goal.update(data);
    return goal;
  }

  async delete(id: number) {
    const goal = await Goal.findByPk(id);
    if (!goal) return false;
    await goal.destroy();
    return true;
  }
}

export default new GoalService();
