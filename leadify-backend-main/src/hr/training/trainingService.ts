import { Op } from 'sequelize';
import { TrainingProgram, TrainingEnrollment } from './trainingModel';
import Employee from '../models/employeeModel';
import { clampPagination } from '../../utils/pagination';

class TrainingService {
  async createProgram(data: any, tenantId?: string) {
    return TrainingProgram.create({ ...data, tenantId });
  }

  async getPrograms(query: any, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;
    if (query.search) where.title = { [Op.iLike]: `%${query.search}%` };

    const { rows, count } = await TrainingProgram.findAndCountAll({
      where, order: [['createdAt', 'DESC']], limit, offset, distinct: true
    });
    return { docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
  }

  async updateProgram(id: number, data: any) {
    const program = await TrainingProgram.findByPk(id);
    if (!program) return null;
    await program.update(data);
    return program;
  }

  async deleteProgram(id: number) {
    const program = await TrainingProgram.findByPk(id);
    if (!program) return false;
    await program.destroy();
    return true;
  }

  async enroll(data: any, tenantId?: string) {
    return TrainingEnrollment.create({ ...data, tenantId });
  }

  async getEnrollments(query: any, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.programId) where.programId = query.programId;
    if (query.employeeId) where.employeeId = query.employeeId;
    if (query.status) where.status = query.status;

    const { rows, count } = await TrainingEnrollment.findAndCountAll({
      where,
      include: [
        { model: TrainingProgram, as: 'program', attributes: ['id', 'title', 'type', 'category'] },
        { model: Employee, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'position'] }
      ],
      order: [['createdAt', 'DESC']],
      limit, offset, distinct: true
    });
    return { docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
  }

  async updateEnrollment(id: number, data: any) {
    const enrollment = await TrainingEnrollment.findByPk(id);
    if (!enrollment) return null;
    if (data.status === 'COMPLETED' && !enrollment.completedAt) {
      data.completedAt = new Date();
    }
    await enrollment.update(data);
    return enrollment;
  }

  async deleteEnrollment(id: number) {
    const enrollment = await TrainingEnrollment.findByPk(id);
    if (!enrollment) return false;
    await enrollment.destroy();
    return true;
  }
}

export default new TrainingService();
