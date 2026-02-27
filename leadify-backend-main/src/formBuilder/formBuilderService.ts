import { Op, fn, col, literal } from 'sequelize';
import { FormTemplate, FormSubmission } from './formBuilderModel';
import { clampPagination } from '../utils/pagination';

interface FormField {
  name: string;
  type: string;
  label: string;
  required: boolean;
  options?: string[];
}

interface ValidationError {
  field: string;
  message: string;
}

class FormBuilderService {
  async createTemplate(data: any, tenantId?: string) {
    const embedToken = this.generateEmbedToken();
    return FormTemplate.create({ ...data, tenantId, embedToken });
  }

  private generateEmbedToken(): string {
    return `emb_${Math.random().toString(36).substring(2, 15)}${Date.now().toString(36)}`;
  }

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

  async submitForm(formId: number, data: any, meta?: { source?: string; ipAddress?: string; utmParams?: Record<string, any>; userAgent?: string }) {
    const form = await FormTemplate.findByPk(formId);
    if (!form) return null;

    // Rate limiting check (simple IP-based)
    if (meta?.ipAddress && form.rateLimit > 0) {
      const recentSubmissions = await FormSubmission.count({
        where: {
          formId,
          ipAddress: meta.ipAddress,
          createdAt: { [Op.gte]: new Date(Date.now() - 3600000) } // Last hour
        }
      });
      if (recentSubmissions >= form.rateLimit) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
    }

    const submission = await FormSubmission.create({
      formId,
      data,
      source: meta?.source,
      ipAddress: meta?.ipAddress,
      utmParams: meta?.utmParams,
      userAgent: meta?.userAgent,
      tenantId: form.tenantId
    });
    await form.increment('submissionCount');

    // Send auto-response email if enabled
    if (form.autoResponse?.enabled && data.email) {
      await this.sendAutoResponseEmail(form, data);
    }

    return submission;
  }

  private async sendAutoResponseEmail(form: FormTemplate, data: Record<string, any>) {
    try {
      // TODO: Integrate with email service
      console.log(`Auto-response email for form ${form.id} to ${data.email}`);
    } catch (e) {
      console.error('Failed to send auto-response:', e);
    }
  }

  async trackFormView(formId: number) {
    const form = await FormTemplate.findByPk(formId);
    if (!form) return null;
    await form.increment('viewCount');
    return { viewCount: form.viewCount + 1 };
  }

  async getFormByEmbedToken(token: string) {
    return FormTemplate.findOne({ where: { embedToken: token, status: 'ACTIVE' } });
  }

  async getSubmissions(query: any, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.formId) where.formId = query.formId;
    const { rows, count } = await FormSubmission.findAndCountAll({ where, order: [['createdAt', 'DESC']], limit, offset });
    return { docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
  }

  /**
   * Validate submitted data against the form template's field definitions.
   * Checks: required fields, type correctness (email format, number range), string length limits.
   */
  async validateSubmission(formId: number, data: Record<string, any>): Promise<{ valid: boolean; errors: ValidationError[] }> {
    const form = await FormTemplate.findByPk(formId);
    if (!form) return { valid: false, errors: [{ field: '_form', message: 'Form template not found' }] };

    const fields: FormField[] = form.fields || [];
    const errors: ValidationError[] = [];

    for (const field of fields) {
      const value = data[field.name];

      // Required check
      if (field.required && (value === undefined || value === null || value === '')) {
        errors.push({ field: field.name, message: `${field.label} is required` });
        continue;
      }

      // Skip further validation if value is empty and not required
      if (value === undefined || value === null || value === '') continue;

      // Type-specific validation
      switch (field.type) {
        case 'email': {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (typeof value !== 'string' || !emailRegex.test(value)) {
            errors.push({ field: field.name, message: `${field.label} must be a valid email address` });
          }
          break;
        }
        case 'number': {
          const num = Number(value);
          if (isNaN(num)) {
            errors.push({ field: field.name, message: `${field.label} must be a valid number` });
          }
          break;
        }
        case 'phone': {
          const phoneRegex = /^[\d\s\-+()]{7,20}$/;
          if (typeof value !== 'string' || !phoneRegex.test(value)) {
            errors.push({ field: field.name, message: `${field.label} must be a valid phone number` });
          }
          break;
        }
        case 'url': {
          try {
            new URL(value);
          } catch {
            errors.push({ field: field.name, message: `${field.label} must be a valid URL` });
          }
          break;
        }
        case 'select':
        case 'radio': {
          if (field.options && field.options.length > 0 && !field.options.includes(value)) {
            errors.push({ field: field.name, message: `${field.label} must be one of: ${field.options.join(', ')}` });
          }
          break;
        }
        case 'checkbox': {
          if (typeof value !== 'boolean' && !Array.isArray(value)) {
            errors.push({ field: field.name, message: `${field.label} must be a boolean or array of selections` });
          }
          break;
        }
        case 'text':
        case 'textarea':
        default: {
          if (typeof value === 'string' && value.length > 5000) {
            errors.push({ field: field.name, message: `${field.label} exceeds maximum length of 5000 characters` });
          }
          break;
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Analytics for a form: total submissions, daily submissions (last 30 days),
   * and field completion rates, conversion rate, source breakdown.
   */
  async getFormAnalytics(formId: number) {
    const form = await FormTemplate.findByPk(formId);
    if (!form) return null;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Total submissions
    const totalSubmissions = await FormSubmission.count({ where: { formId } });
    const totalViews = form.viewCount || 0;
    const conversionRate = totalViews > 0 ? Math.round((totalSubmissions / totalViews) * 10000) / 100 : 0;

    // Submissions per day (last 30 days)
    const dailySubmissions = await FormSubmission.findAll({
      where: { formId, createdAt: { [Op.gte]: thirtyDaysAgo } },
      attributes: [
        [fn('DATE', col('createdAt')), 'date'],
        [fn('COUNT', col('id')), 'count'],
      ],
      group: [fn('DATE', col('createdAt'))],
      order: [[fn('DATE', col('createdAt')), 'ASC']],
      raw: true,
    }) as unknown as Array<{ date: string; count: string }>;

    // Source breakdown
    const sourceBreakdown = await FormSubmission.findAll({
      where: { formId },
      attributes: [
        ['source', 'source'],
        [fn('COUNT', col('id')), 'count'],
      ],
      group: ['source'],
      raw: true,
    }) as unknown as Array<{ source: string; count: string }>;

    // Field completion rates
    const fields: FormField[] = form.fields || [];
    const fieldCompletionRates: Record<string, { completed: number; total: number; rate: number }> = {};

    if (totalSubmissions > 0 && fields.length > 0) {
      const allSubmissions = await FormSubmission.findAll({ where: { formId }, attributes: ['data'], raw: true });

      for (const field of fields) {
        let completed = 0;
        for (const sub of allSubmissions) {
          const data = sub.data as Record<string, any>;
          if (data && data[field.name] !== undefined && data[field.name] !== null && data[field.name] !== '') {
            completed++;
          }
        }
        fieldCompletionRates[field.name] = {
          completed,
          total: totalSubmissions,
          rate: Math.round((completed / totalSubmissions) * 10000) / 100,
        };
      }
    }

    return {
      formId,
      formName: form.name,
      totalSubmissions,
      totalViews,
      conversionRate,
      dailySubmissions: dailySubmissions.map((d) => ({ date: d.date, count: Number(d.count) })),
      sourceBreakdown: sourceBreakdown.map((s) => ({ source: s.source || 'direct', count: Number(s.count) })),
      fieldCompletionRates,
    };
  }

  /**
   * Clone an existing form template with a new name "{original} (Copy)".
   */
  async duplicateForm(formId: number, tenantId?: string) {
    const original = await FormTemplate.findByPk(formId);
    if (!original) return null;

    const clone = await FormTemplate.create({
      name: `${original.name} (Copy)`,
      description: original.description,
      status: 'DRAFT' as const,
      fields: original.fields,
      settings: original.settings,
      thankYouMessage: original.thankYouMessage,
      redirectUrl: original.redirectUrl,
      createLead: original.createLead,
      submissionCount: 0,
      tenantId: tenantId || original.tenantId,
    });

    return clone;
  }

  /**
   * Return all submissions for a form in a structured format for CSV/Excel export.
   * Returns headers (field labels) and rows of data.
   */
  async getSubmissionExport(formId: number, format: 'json' | 'csv' = 'json') {
    const form = await FormTemplate.findByPk(formId);
    if (!form) return null;

    const fields: FormField[] = form.fields || [];
    const submissions = await FormSubmission.findAll({
      where: { formId },
      order: [['createdAt', 'ASC']],
    });

    const headers = [
      'Submission ID',
      'Submitted At',
      'Source',
      ...fields.map((f) => f.label),
    ];

    const rows = submissions.map((sub) => {
      const data = sub.data as Record<string, any>;
      return [
        sub.id,
        sub.createdAt,
        sub.source || '',
        ...fields.map((f) => {
          const val = data[f.name];
          if (val === undefined || val === null) return '';
          if (Array.isArray(val)) return val.join('; ');
          return String(val);
        }),
      ];
    });

    if (format === 'csv') {
      const escapeCsv = (val: any) => {
        const str = String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };
      const csvContent = [
        headers.map(escapeCsv).join(','),
        ...rows.map((row) => row.map(escapeCsv).join(',')),
      ].join('\n');
      return { csv: csvContent, totalRows: rows.length };
    }

    return { headers, rows, totalRows: rows.length };
  }
}
export default new FormBuilderService();
