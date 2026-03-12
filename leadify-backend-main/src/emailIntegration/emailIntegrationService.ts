import { WhereOptions } from 'sequelize';
import { clampPagination } from '../utils/pagination';
import EmailAccount from './emailAccountModel';
import EmailMessage from './emailMessageModel';
import EmailTracking from './emailTrackingModel';

class EmailIntegrationService {
  async getAccounts(userId: string): Promise<EmailAccount[]> {
    return EmailAccount.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });
  }

  async connectAccount(data: Record<string, unknown>): Promise<EmailAccount> {
    return EmailAccount.create(data);
  }

  async disconnectAccount(id: string): Promise<void> {
    const account = await EmailAccount.findByPk(id);
    if (!account) throw new Error('Email account not found');
    await account.update({ isActive: false });
    await account.destroy();
  }

  async getMessages(accountId: string, query: Record<string, unknown>): Promise<any> {
    const { page, limit, offset } = clampPagination(query, 20);
    const { folder } = query;

    const where: WhereOptions = { accountId } as any;
    if (folder) {
      (where as any).folder = folder;
    }

    const { rows: docs, count: totalItems } = await EmailMessage.findAndCountAll({
      where,
      limit,
      offset,
      order: [['sentAt', 'DESC']],
      include: [{ model: EmailAccount, attributes: ['id', 'email', 'provider'] }]
    });

    return {
      docs,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit)
      }
    };
  }

  async sendEmail(accountId: string, data: Record<string, unknown>): Promise<EmailMessage> {
    const account = await EmailAccount.findByPk(accountId);
    if (!account) throw new Error('Email account not found');

    const message = await EmailMessage.create({
      accountId,
      subject: data.subject,
      from: account.email,
      to: data.to,
      cc: data.cc,
      body: data.body,
      folder: 'sent',
      sentAt: new Date(),
      entityType: data.entityType,
      entityId: data.entityId
    });

    return message;
  }

  async getTracking(messageId: string): Promise<EmailTracking[]> {
    return EmailTracking.findAll({
      where: { messageId },
      order: [['occurredAt', 'DESC']]
    });
  }
}

export default new EmailIntegrationService();
