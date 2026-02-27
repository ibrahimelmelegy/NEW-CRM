import { Op } from 'sequelize';
import { LoyaltyProgram, LoyaltyPoints } from './loyaltyModel';
import Client from '../client/clientModel';
import { clampPagination } from '../utils/pagination';

class LoyaltyService {
  async createProgram(data: any, tenantId?: string) { return LoyaltyProgram.create({ ...data, tenantId }); }

  async getPrograms(query: any, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.status) where.status = query.status;
    if (query.search) where.name = { [Op.iLike]: `%${query.search}%` };
    const { rows, count } = await LoyaltyProgram.findAndCountAll({ where, order: [['createdAt', 'DESC']], limit, offset });
    return { docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
  }

  async updateProgram(id: number, data: any) {
    const item = await LoyaltyProgram.findByPk(id);
    if (!item) return null;
    await item.update(data);
    return item;
  }

  async deleteProgram(id: number) {
    const item = await LoyaltyProgram.findByPk(id);
    if (!item) return false;
    await item.destroy();
    return true;
  }

  async addPoints(data: any, tenantId?: string) { return LoyaltyPoints.create({ ...data, tenantId }); }

  async getPointsHistory(query: any, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.clientId) where.clientId = query.clientId;
    if (query.programId) where.programId = query.programId;
    const { rows, count } = await LoyaltyPoints.findAndCountAll({
      where,
      include: [{ model: Client, as: 'client', attributes: ['id', 'name', 'email'] }],
      order: [['createdAt', 'DESC']], limit, offset, distinct: true
    });
    return { docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
  }

  async getClientBalance(clientId: string, programId: number) {
    const earned = await LoyaltyPoints.sum('points', { where: { clientId, programId, transactionType: 'EARN' } }) || 0;
    const redeemed = await LoyaltyPoints.sum('points', { where: { clientId, programId, transactionType: 'REDEEM' } }) || 0;
    return { balance: earned - Math.abs(redeemed), earned, redeemed };
  }
}
export default new LoyaltyService();
