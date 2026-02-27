import { Op } from 'sequelize';
import Commission from './commissionModel';
import User from '../user/userModel';
import Deal from '../deal/model/dealModel';
import { clampPagination } from '../utils/pagination';

class CommissionService {
  async create(data: any, tenantId?: string) {
    return Commission.create({ ...data, tenantId });
  }

  async getAll(query: any, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.status) where.status = query.status;
    if (query.staffId) where.staffId = query.staffId;
    if (query.search) where[Op.or] = [{ notes: { [Op.iLike]: `%${query.search}%` } }];

    const { rows, count } = await Commission.findAndCountAll({
      where,
      include: [
        { model: User, as: 'staff', attributes: ['id', 'name', 'email'] },
        { model: Deal, as: 'deal', attributes: ['id', 'name', 'price'] }
      ],
      order: [['createdAt', 'DESC']], limit, offset, distinct: true
    });
    return { docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
  }

  async update(id: number, data: any) {
    const commission = await Commission.findByPk(id);
    if (!commission) return null;
    if (data.status === 'PAID' && !commission.paidAt) data.paidAt = new Date();
    await commission.update(data);
    return commission;
  }

  async delete(id: number) {
    const commission = await Commission.findByPk(id);
    if (!commission) return false;
    await commission.destroy();
    return true;
  }
}

export default new CommissionService();
