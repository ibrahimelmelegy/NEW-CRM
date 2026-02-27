import { Op } from 'sequelize';
import SocialProfile from './socialCrmModel';
import Client from '../client/clientModel';
import { clampPagination } from '../utils/pagination';

class SocialCrmService {
  async create(data: any, tenantId?: string) { return SocialProfile.create({ ...data, tenantId }); }

  async getAll(query: any, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.platform) where.platform = query.platform;
    if (query.clientId) where.clientId = query.clientId;
    if (query.search) where.handle = { [Op.iLike]: `%${query.search}%` };
    const { rows, count } = await SocialProfile.findAndCountAll({
      where,
      include: [{ model: Client, as: 'client', attributes: ['id', 'name', 'email'] }],
      order: [['createdAt', 'DESC']], limit, offset, distinct: true
    });
    return { docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
  }

  async update(id: number, data: any) {
    const item = await SocialProfile.findByPk(id);
    if (!item) return null;
    await item.update(data);
    return item;
  }

  async delete(id: number) {
    const item = await SocialProfile.findByPk(id);
    if (!item) return false;
    await item.destroy();
    return true;
  }
}
export default new SocialCrmService();
