import { Op } from 'sequelize';
import PerformanceReview from './performanceModel';
import Employee from '../models/employeeModel';
import User from '../../user/userModel';
import { clampPagination } from '../../utils/pagination';

class PerformanceService {
  async create(data: any, tenantId?: string) {
    return PerformanceReview.create({ ...data, tenantId });
  }

  async getAll(query: any, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.status) where.status = query.status;
    if (query.period) where.period = query.period;
    if (query.employeeId) where.employeeId = query.employeeId;
    if (query.search) {
      where[Op.or] = [{ period: { [Op.iLike]: `%${query.search}%` } }];
    }

    const { rows, count } = await PerformanceReview.findAndCountAll({
      where,
      include: [
        { model: Employee, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'position', 'department'] },
        { model: User, as: 'reviewer', attributes: ['id', 'name', 'email'] }
      ],
      order: [['createdAt', 'DESC']],
      limit, offset, distinct: true
    });
    return { docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
  }

  async getById(id: number) {
    return PerformanceReview.findByPk(id, {
      include: [
        { model: Employee, as: 'employee' },
        { model: User, as: 'reviewer', attributes: ['id', 'name', 'email'] }
      ]
    });
  }

  async update(id: number, data: any) {
    const review = await PerformanceReview.findByPk(id);
    if (!review) return null;
    await review.update(data);
    return this.getById(id);
  }

  async delete(id: number) {
    const review = await PerformanceReview.findByPk(id);
    if (!review) return false;
    await review.destroy();
    return true;
  }
}

export default new PerformanceService();
