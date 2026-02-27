import { Op } from 'sequelize';
import { Survey, SurveyResponse } from './surveyModel';
import { clampPagination } from '../utils/pagination';

class SurveyService {
  async create(data: any, tenantId?: string) { return Survey.create({ ...data, tenantId }); }

  async getAll(query: any, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.status) where.status = query.status;
    if (query.search) where.title = { [Op.iLike]: `%${query.search}%` };
    const { rows, count } = await Survey.findAndCountAll({ where, order: [['createdAt', 'DESC']], limit, offset });
    return { docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
  }

  async getById(id: number) { return Survey.findByPk(id, { include: [{ model: SurveyResponse, as: 'responses' }] }); }

  async update(id: number, data: any) {
    const item = await Survey.findByPk(id);
    if (!item) return null;
    await item.update(data);
    return item;
  }

  async delete(id: number) {
    const item = await Survey.findByPk(id);
    if (!item) return false;
    await SurveyResponse.destroy({ where: { surveyId: id } });
    await item.destroy();
    return true;
  }

  async submitResponse(surveyId: number, data: any) {
    const survey = await Survey.findByPk(surveyId);
    if (!survey) return null;
    const response = await SurveyResponse.create({ surveyId, ...data, completedAt: new Date(), tenantId: survey.tenantId });
    await survey.increment('responseCount');
    return response;
  }

  async getResponses(query: any, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.surveyId) where.surveyId = query.surveyId;
    const { rows, count } = await SurveyResponse.findAndCountAll({ where, order: [['createdAt', 'DESC']], limit, offset });
    return { docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
  }
}
export default new SurveyService();
