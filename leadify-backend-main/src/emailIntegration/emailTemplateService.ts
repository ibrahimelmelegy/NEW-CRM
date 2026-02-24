import ComposerTemplate from './emailTemplateModel';
import BaseError from '../utils/error/base-http-exception';
import { ERRORS } from '../utils/error/errors';

class EmailTemplateService {
  async getTemplates(tenantId?: string): Promise<ComposerTemplate[]> {
    return ComposerTemplate.findAll({
      where: tenantId ? { tenantId } : {},
      order: [['createdAt', 'DESC']]
    });
  }

  async getTemplateById(id: string): Promise<ComposerTemplate> {
    const template = await ComposerTemplate.findByPk(id);
    if (!template) throw new BaseError(ERRORS.NOT_FOUND);
    return template;
  }

  async createTemplate(data: any, tenantId?: string): Promise<ComposerTemplate> {
    return ComposerTemplate.create({ ...data, tenantId });
  }

  async updateTemplate(id: string, data: any): Promise<ComposerTemplate> {
    const template = await ComposerTemplate.findByPk(id);
    if (!template) throw new BaseError(ERRORS.NOT_FOUND);
    await template.update(data);
    return template;
  }

  async deleteTemplate(id: string): Promise<void> {
    const template = await ComposerTemplate.findByPk(id);
    if (!template) throw new BaseError(ERRORS.NOT_FOUND);
    await template.destroy();
  }

  async seedDefaults(tenantId?: string): Promise<void> {
    const count = await ComposerTemplate.count({ where: tenantId ? { tenantId } : {} });
    if (count > 0) return;

    const defaults = [
      {
        name: 'Follow Up',
        subject: 'Following up on our conversation',
        body: '<p>Hi {{firstName}},</p><p>I wanted to follow up on our recent conversation about {{dealName}}. I believe we can add significant value to {{companyName}}.</p><p>Would you be available for a quick call this week?</p><p>Best regards</p>',
        category: 'follow-up',
        variables: ['firstName', 'dealName', 'companyName'],
        isDefault: true
      },
      {
        name: 'Introduction',
        subject: 'Introduction - {{companyName}}',
        body: '<p>Hi {{firstName}},</p><p>I hope this email finds you well. My name is {{senderName}} and I am reaching out from our team.</p><p>I noticed that {{companyName}} might benefit from our solutions. I would love to schedule a brief call to discuss how we can help.</p><p>Looking forward to hearing from you.</p>',
        category: 'introduction',
        variables: ['firstName', 'companyName', 'senderName'],
        isDefault: true
      },
      {
        name: 'Proposal',
        subject: 'Proposal for {{dealName}}',
        body: '<p>Hi {{firstName}},</p><p>Thank you for your time discussing {{dealName}}. As promised, please find our proposal attached.</p><p>Key highlights:</p><ul><li>Customized solution for {{companyName}}</li><li>Competitive pricing</li><li>Dedicated support team</li></ul><p>Please let me know if you have any questions.</p>',
        category: 'proposal',
        variables: ['firstName', 'dealName', 'companyName'],
        isDefault: true
      },
      {
        name: 'Thank You',
        subject: 'Thank you, {{firstName}}!',
        body: '<p>Hi {{firstName}},</p><p>I just wanted to take a moment to thank you for choosing to work with us. We are excited about the partnership with {{companyName}}.</p><p>If there is anything you need, please do not hesitate to reach out.</p>',
        category: 'thank-you',
        variables: ['firstName', 'companyName'],
        isDefault: true
      },
      {
        name: 'Win Back',
        subject: 'We miss you, {{firstName}}!',
        body: '<p>Hi {{firstName}},</p><p>It has been a while since we last connected. I wanted to reach out and see how things are going at {{companyName}}.</p><p>We have made some exciting improvements that I think you would find valuable. Would you be open to a brief catch-up?</p>',
        category: 'win-back',
        variables: ['firstName', 'companyName'],
        isDefault: true
      }
    ];

    await ComposerTemplate.bulkCreate(defaults.map(d => ({ ...d, tenantId })));
  }
}

export default new EmailTemplateService();
