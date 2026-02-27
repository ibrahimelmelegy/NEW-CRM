import { Op } from 'sequelize';
import { FormTemplate, FormSubmission } from './formBuilderModel';
import { clampPagination } from '../utils/pagination';

class FormBuilderService {
  async createTemplate(data: any, tenantId?: string) { return FormTemplate.create({ ...data, tenantId }); }

  async getTemplates(query: any, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.status) where.status = query.status;
    if (query.search) where.name = { [Op.iLike]: `%${query.search}%` };
    const { rows, count } = await FormTemplate.findAndCountAll({ where, order: [['createdAt', 'DESC']], limit, offset });
    return { docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
  }

  async updateTemplate(id: number, data: any) {
    const item = await FormTemplate.findByPk(id);
    if (!item) return null;
    await item.update(data);
    return item;
  }

  async deleteTemplate(id: number) {
    const item = await FormTemplate.findByPk(id);
    if (!item) return false;
    await FormSubmission.destroy({ where: { formId: id } });
    await item.destroy();
    return true;
  }

  async submitForm(formId: number, data: any, meta?: { source?: string; ipAddress?: string }) {
    const form = await FormTemplate.findByPk(formId);
    if (!form) return null;
    const submission = await FormSubmission.create({ formId, data, source: meta?.source, ipAddress: meta?.ipAddress, tenantId: form.tenantId });
    await form.increment('submissionCount');
    return submission;
  }

  async getSubmissions(query: any, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.formId) where.formId = query.formId;
    const { rows, count } = await FormSubmission.findAndCountAll({ where, order: [['createdAt', 'DESC']], limit, offset });
    return { docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
  }
}
export default new FormBuilderService();
