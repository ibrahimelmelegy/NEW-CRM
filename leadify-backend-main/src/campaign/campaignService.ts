import Campaign from './campaignModel';
import CampaignRecipient from './campaignRecipientModel';
import EmailTemplate from './emailTemplateModel';
import { CampaignStatus, RecipientStatus } from './campaignEnum';
import { sendEmail } from '../utils/emailHelper';

class CampaignService {
  async getCampaigns(userId: number) {
    return Campaign.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      attributes: { include: ['id', 'name', 'subject', 'status', 'scheduledAt', 'sentAt', 'createdAt'] }
    });
  }

  async getCampaignById(id: string, userId: number) {
    const campaign = await Campaign.findOne({
      where: { id, userId },
      include: [{ model: CampaignRecipient }]
    });
    if (!campaign) throw new Error('Campaign not found');
    return campaign;
  }

  async create(userId: number, data: any) {
    const campaign = await Campaign.create({ ...data, userId, status: CampaignStatus.DRAFT });

    if (data.recipients?.length) {
      await CampaignRecipient.bulkCreate(
        data.recipients.map((r: any) => ({
          campaignId: campaign.id,
          contactEmail: r.email,
          contactName: r.name
        }))
      );
    }

    return campaign;
  }

  async update(id: string, userId: number, data: any) {
    const campaign = await Campaign.findOne({ where: { id, userId } });
    if (!campaign) throw new Error('Campaign not found');
    if (campaign.status !== CampaignStatus.DRAFT) throw new Error('Can only edit draft campaigns');

    if (data.recipients) {
      await CampaignRecipient.destroy({ where: { campaignId: id } });
      await CampaignRecipient.bulkCreate(
        data.recipients.map((r: any) => ({
          campaignId: id,
          contactEmail: r.email,
          contactName: r.name
        }))
      );
      delete data.recipients;
    }

    return campaign.update(data);
  }

  async delete(id: string, userId: number) {
    const campaign = await Campaign.findOne({ where: { id, userId } });
    if (!campaign) throw new Error('Campaign not found');
    await CampaignRecipient.destroy({ where: { campaignId: id } });
    await campaign.destroy();
  }

  async sendCampaign(id: string, userId: number) {
    const campaign = await Campaign.findOne({
      where: { id, userId },
      include: [{ model: CampaignRecipient }]
    });
    if (!campaign) throw new Error('Campaign not found');
    if (!campaign.recipients?.length) throw new Error('No recipients');

    await campaign.update({ status: CampaignStatus.SENDING });

    let sentCount = 0;
    for (const recipient of campaign.recipients) {
      try {
        const html = this.interpolateContent(campaign.htmlContent || '', {
          name: recipient.contactName || '',
          email: recipient.contactEmail
        });

        await sendEmail({
          to: recipient.contactEmail,
          subject: campaign.subject,
          text: html.replace(/<[^>]*>/g, ''),
          html
        });

        await recipient.update({ status: RecipientStatus.SENT });
        sentCount++;
      } catch {
        await recipient.update({ status: RecipientStatus.FAILED });
      }
    }

    await campaign.update({
      status: CampaignStatus.SENT,
      sentAt: new Date()
    });

    return { sent: sentCount, total: campaign.recipients.length };
  }

  async getAnalytics(id: string, userId: number) {
    const campaign = await Campaign.findOne({
      where: { id, userId },
      include: [{ model: CampaignRecipient }]
    });
    if (!campaign) throw new Error('Campaign not found');

    const recipients = campaign.recipients || [];
    return {
      total: recipients.length,
      sent: recipients.filter(r => r.status !== RecipientStatus.PENDING && r.status !== RecipientStatus.FAILED).length,
      opened: recipients.filter(r => r.openedAt).length,
      clicked: recipients.filter(r => r.clickedAt).length,
      failed: recipients.filter(r => r.status === RecipientStatus.FAILED).length,
      openRate: recipients.length ? Math.round((recipients.filter(r => r.openedAt).length / recipients.length) * 100) : 0,
      clickRate: recipients.length ? Math.round((recipients.filter(r => r.clickedAt).length / recipients.length) * 100) : 0
    };
  }

  // Templates
  async getTemplates(userId: number) {
    return EmailTemplate.findAll({ where: { userId }, order: [['createdAt', 'DESC']] });
  }

  async createTemplate(userId: number, data: any) {
    return EmailTemplate.create({ ...data, userId });
  }

  async deleteTemplate(id: string, userId: number) {
    const template = await EmailTemplate.findOne({ where: { id, userId } });
    if (!template) throw new Error('Template not found');
    await template.destroy();
  }

  private interpolateContent(html: string, data: Record<string, string>): string {
    return html.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] ?? '');
  }
}

export default new CampaignService();
