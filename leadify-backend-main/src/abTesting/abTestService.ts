import { Op } from 'sequelize';
import ABTest from './abTestModel';
import { clampPagination } from '../utils/pagination';

class ABTestService {
  async create(data: any, tenantId?: string) { return ABTest.create({ ...data, tenantId }); }

  async getAll(query: any, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;
    if (query.search) where.name = { [Op.iLike]: `%${query.search}%` };
    const { rows, count } = await ABTest.findAndCountAll({ where, order: [['createdAt', 'DESC']], limit, offset });
    return { docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
  }

  async update(id: number, data: any) {
    const item = await ABTest.findByPk(id);
    if (!item) return null;
    await item.update(data);
    return item;
  }

  async delete(id: number) {
    const item = await ABTest.findByPk(id);
    if (!item) return false;
    await item.destroy();
    return true;
  }
}
export default new ABTestService();
