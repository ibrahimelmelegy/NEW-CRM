import { Op } from 'sequelize';
import { JobPosting, Applicant } from './recruitmentModel';
import Department from '../models/departmentModel';
import { clampPagination } from '../../utils/pagination';

class RecruitmentService {
  // Job Postings
  async createPosting(data: any, tenantId?: string) {
    return JobPosting.create({ ...data, tenantId });
  }

  async getPostings(query: any, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.status) where.status = query.status;
    if (query.search) where.title = { [Op.iLike]: `%${query.search}%` };

    const { rows, count } = await JobPosting.findAndCountAll({
      where,
      include: [{ model: Department, as: 'department', attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']],
      limit, offset, distinct: true
    });
    return { docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
  }

  async updatePosting(id: number, data: any) {
    const posting = await JobPosting.findByPk(id);
    if (!posting) return null;
    await posting.update(data);
    return posting;
  }

  async deletePosting(id: number) {
    const posting = await JobPosting.findByPk(id);
    if (!posting) return false;
    await posting.destroy();
    return true;
  }

  // Applicants
  async createApplicant(data: any, tenantId?: string) {
    return Applicant.create({ ...data, tenantId });
  }

  async getApplicants(query: any, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.jobPostingId) where.jobPostingId = query.jobPostingId;
    if (query.stage) where.stage = query.stage;
    if (query.search) where.name = { [Op.iLike]: `%${query.search}%` };

    const { rows, count } = await Applicant.findAndCountAll({
      where,
      include: [{ model: JobPosting, as: 'jobPosting', attributes: ['id', 'title'] }],
      order: [['createdAt', 'DESC']],
      limit, offset, distinct: true
    });
    return { docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
  }

  async updateApplicant(id: number, data: any) {
    const applicant = await Applicant.findByPk(id);
    if (!applicant) return null;
    await applicant.update(data);
    return applicant;
  }

  async deleteApplicant(id: number) {
    const applicant = await Applicant.findByPk(id);
    if (!applicant) return false;
    await applicant.destroy();
    return true;
  }
}

export default new RecruitmentService();
