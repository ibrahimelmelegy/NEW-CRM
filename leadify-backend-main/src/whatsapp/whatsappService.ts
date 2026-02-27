import { Op } from 'sequelize';
import {
  WhatsAppContact, WhatsAppMessage, WhatsAppTemplate,
  WAContactStatus, WAMessageDirection, WAMessageType,
  WAMessageStatus, WATemplateStatus
} from './whatsappModel';
import Client from '../client/clientModel';
import User from '../user/userModel';
import BaseError from '../utils/error/base-http-exception';
import { ERRORS } from '../utils/error/errors';
import { IPaginationRes } from '../types';

class WhatsAppService {
  // ═══════════════════════════════════════════════════════════════════════════
  // CONTACTS
  // ═══════════════════════════════════════════════════════════════════════════

  public async getContacts(
    tenantId: string | null,
    query: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      tags?: string[];
    }
  ): Promise<IPaginationRes<WhatsAppContact>> {
    const page = Number(query.page) || 1;
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 25));
    const offset = (page - 1) * limit;

    const where: any = {};
    if (tenantId) where.tenantId = tenantId;

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where[Op.or] = [
        { phoneNumber: { [Op.iLike]: `%${query.search}%` } },
        { name: { [Op.iLike]: `%${query.search}%` } }
      ];
    }

    if (query.tags && query.tags.length > 0) {
      where.tags = { [Op.overlap]: query.tags };
    }

    const { rows, count } = await WhatsAppContact.findAndCountAll({
      where,
      include: [
        { model: Client, as: 'client', attributes: ['id', 'clientName', 'email'], required: false }
      ],
      order: [['lastMessageAt', 'DESC NULLS LAST']],
      limit,
      offset
    });

    return {
      docs: rows,
      pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) }
    };
  }

  public async getContactById(id: string): Promise<WhatsAppContact> {
    const contact = await WhatsAppContact.findByPk(id, {
      include: [
        { model: Client, as: 'client', attributes: ['id', 'clientName', 'email'], required: false }
      ]
    });
    if (!contact) throw new BaseError(ERRORS.NOT_FOUND);
    return contact;
  }

  public async createContact(
    data: {
      phoneNumber: string;
      name?: string;
      profilePicUrl?: string;
      clientId?: string;
      tags?: string[];
    },
    tenantId: string | null
  ): Promise<WhatsAppContact> {
    // Check for duplicate phone in the same tenant
    const existing = await WhatsAppContact.findOne({
      where: {
        phoneNumber: data.phoneNumber,
        ...(tenantId ? { tenantId } : {})
      }
    });
    if (existing) {
      throw new BaseError(ERRORS.PHONE_ALREADY_EXISTS);
    }

    const contact = await WhatsAppContact.create({
      phoneNumber: data.phoneNumber,
      name: data.name || null,
      profilePicUrl: data.profilePicUrl || null,
      clientId: data.clientId || null,
      tags: data.tags || [],
      tenantId: tenantId || null
    });

    return this.getContactById(contact.id);
  }

  public async updateContact(
    id: string,
    data: {
      name?: string;
      profilePicUrl?: string;
      clientId?: string;
      status?: string;
      tags?: string[];
    }
  ): Promise<WhatsAppContact> {
    const contact = await WhatsAppContact.findByPk(id);
    if (!contact) throw new BaseError(ERRORS.NOT_FOUND);

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.profilePicUrl !== undefined) updateData.profilePicUrl = data.profilePicUrl;
    if (data.clientId !== undefined) updateData.clientId = data.clientId;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.tags !== undefined) updateData.tags = data.tags;

    await contact.update(updateData);
    return this.getContactById(id);
  }

  public async deleteContact(id: string): Promise<void> {
    const contact = await WhatsAppContact.findByPk(id);
    if (!contact) throw new BaseError(ERRORS.NOT_FOUND);
    // Delete all messages for this contact first
    await WhatsAppMessage.destroy({ where: { contactId: id } });
    await contact.destroy();
  }

  public async importFromClients(tenantId: string | null): Promise<{ imported: number; skipped: number }> {
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    // Find clients with phone numbers
    const clients = await Client.findAll({
      where: {
        ...where,
        phoneNumber: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] }
      },
      attributes: ['id', 'clientName', 'phoneNumber']
    });

    let imported = 0;
    let skipped = 0;

    for (const client of clients) {
      const phone = (client as any).phoneNumber;
      if (!phone) { skipped++; continue; }

      const existing = await WhatsAppContact.findOne({
        where: {
          phoneNumber: phone,
          ...(tenantId ? { tenantId } : {})
        }
      });

      if (existing) {
        // Link if not already linked
        if (!existing.clientId) {
          await existing.update({ clientId: client.id, name: existing.name || (client as any).clientName });
        }
        skipped++;
      } else {
        await WhatsAppContact.create({
          phoneNumber: phone,
          name: (client as any).clientName,
          clientId: client.id,
          tags: [],
          tenantId: tenantId || null
        });
        imported++;
      }
    }

    return { imported, skipped };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MESSAGES
  // ═══════════════════════════════════════════════════════════════════════════

  public async getMessages(
    contactId: string,
    query: { page?: number; limit?: number }
  ): Promise<IPaginationRes<WhatsAppMessage>> {
    const page = Number(query.page) || 1;
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 50));
    const offset = (page - 1) * limit;

    const { rows, count } = await WhatsAppMessage.findAndCountAll({
      where: { contactId },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'name', 'profilePicture'], required: false }
      ],
      order: [['createdAt', 'ASC']],
      limit,
      offset
    });

    return {
      docs: rows,
      pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) }
    };
  }

  public async sendTextMessage(
    contactId: string,
    content: string,
    userId: number,
    tenantId: string | null
  ): Promise<WhatsAppMessage> {
    const contact = await WhatsAppContact.findByPk(contactId);
    if (!contact) throw new BaseError(ERRORS.NOT_FOUND);

    const message = await WhatsAppMessage.create({
      contactId,
      direction: WAMessageDirection.OUTBOUND,
      content,
      type: WAMessageType.TEXT,
      status: WAMessageStatus.SENT,
      metadata: {},
      tenantId: tenantId || null,
      sentBy: userId
    });

    // Update contact's lastMessageAt and reset unread for outbound
    await contact.update({ lastMessageAt: new Date() });

    return this.getMessageById(message.id);
  }

  public async sendMediaMessage(
    contactId: string,
    data: {
      content: string;
      type: string;
      mediaUrl: string;
      mediaCaption?: string;
      fileName?: string;
    },
    userId: number,
    tenantId: string | null
  ): Promise<WhatsAppMessage> {
    const contact = await WhatsAppContact.findByPk(contactId);
    if (!contact) throw new BaseError(ERRORS.NOT_FOUND);

    const message = await WhatsAppMessage.create({
      contactId,
      direction: WAMessageDirection.OUTBOUND,
      content: data.content || data.mediaCaption || '',
      type: data.type || WAMessageType.DOCUMENT,
      mediaUrl: data.mediaUrl,
      mediaCaption: data.mediaCaption || null,
      fileName: data.fileName || null,
      status: WAMessageStatus.SENT,
      metadata: {},
      tenantId: tenantId || null,
      sentBy: userId
    });

    await contact.update({ lastMessageAt: new Date() });

    return this.getMessageById(message.id);
  }

  public async sendTemplateMessage(
    contactId: string,
    templateId: string,
    variables: Record<string, string>,
    userId: number,
    tenantId: string | null
  ): Promise<WhatsAppMessage> {
    const contact = await WhatsAppContact.findByPk(contactId);
    if (!contact) throw new BaseError(ERRORS.NOT_FOUND);

    const template = await WhatsAppTemplate.findByPk(templateId);
    if (!template) throw new BaseError(ERRORS.NOT_FOUND);

    // Render template content with variables
    let renderedContent = template.content;
    for (const [key, value] of Object.entries(variables)) {
      renderedContent = renderedContent.replace(`{{${key}}}`, value);
    }

    const message = await WhatsAppMessage.create({
      contactId,
      direction: WAMessageDirection.OUTBOUND,
      content: renderedContent,
      type: WAMessageType.TEMPLATE,
      templateName: template.name,
      status: WAMessageStatus.SENT,
      metadata: { templateId, variables },
      tenantId: tenantId || null,
      sentBy: userId
    });

    await contact.update({ lastMessageAt: new Date() });

    return this.getMessageById(message.id);
  }

  public async markAsRead(contactId: string): Promise<void> {
    await WhatsAppMessage.update(
      { status: WAMessageStatus.READ },
      {
        where: {
          contactId,
          direction: WAMessageDirection.INBOUND,
          status: { [Op.ne]: WAMessageStatus.READ }
        }
      }
    );

    await WhatsAppContact.update({ unreadCount: 0 }, { where: { id: contactId } });
  }

  public async recordInboundMessage(
    phoneNumber: string,
    content: string,
    externalId: string,
    type: string = WAMessageType.TEXT,
    metadata: Record<string, any> = {},
    tenantId?: string
  ): Promise<WhatsAppMessage | null> {
    // Find the contact by phone number
    let contact = await WhatsAppContact.findOne({
      where: {
        phoneNumber,
        ...(tenantId ? { tenantId } : {})
      }
    });

    // Auto-create contact if they sent us a message
    if (!contact) {
      contact = await WhatsAppContact.create({
        phoneNumber,
        name: phoneNumber,
        tags: [],
        tenantId: tenantId || null
      });
    }

    const message = await WhatsAppMessage.create({
      contactId: contact.id,
      direction: WAMessageDirection.INBOUND,
      content,
      type,
      status: WAMessageStatus.DELIVERED,
      externalId,
      metadata,
      tenantId: tenantId || null
    });

    // Update unread count and last message
    await contact.update({
      lastMessageAt: new Date(),
      unreadCount: (contact.unreadCount || 0) + 1
    });

    return this.getMessageById(message.id);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BULK MESSAGING
  // ═══════════════════════════════════════════════════════════════════════════

  public async sendBulkTemplate(
    contactIds: string[],
    templateId: string,
    variables: Record<string, string>,
    userId: number,
    tenantId: string | null
  ): Promise<{ sent: number; failed: number; results: any[] }> {
    const template = await WhatsAppTemplate.findByPk(templateId);
    if (!template) throw new BaseError(ERRORS.NOT_FOUND);

    let sent = 0;
    let failed = 0;
    const results: any[] = [];

    for (const contactId of contactIds) {
      try {
        const msg = await this.sendTemplateMessage(contactId, templateId, variables, userId, tenantId);
        sent++;
        results.push({ contactId, messageId: msg.id, status: 'SENT' });
      } catch (err: any) {
        failed++;
        results.push({ contactId, status: 'FAILED', error: err.message });
      }
    }

    return { sent, failed, results };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TEMPLATES
  // ═══════════════════════════════════════════════════════════════════════════

  public async getTemplates(
    tenantId: string | null,
    query: { page?: number; limit?: number; search?: string; category?: string; status?: string }
  ): Promise<IPaginationRes<WhatsAppTemplate>> {
    const page = Number(query.page) || 1;
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 25));
    const offset = (page - 1) * limit;

    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.category) where.category = query.category;
    if (query.status) where.status = query.status;
    if (query.search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${query.search}%` } },
        { content: { [Op.iLike]: `%${query.search}%` } }
      ];
    }

    const { rows, count } = await WhatsAppTemplate.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    return {
      docs: rows,
      pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) }
    };
  }

  public async getTemplateById(id: string): Promise<WhatsAppTemplate> {
    const template = await WhatsAppTemplate.findByPk(id);
    if (!template) throw new BaseError(ERRORS.NOT_FOUND);
    return template;
  }

  public async createTemplate(
    data: {
      name: string;
      language?: string;
      category?: string;
      content: string;
      headerType?: string;
      headerContent?: string;
      footerText?: string;
      buttons?: any[];
    },
    tenantId: string | null
  ): Promise<WhatsAppTemplate> {
    const template = await WhatsAppTemplate.create({
      name: data.name,
      language: data.language || 'en',
      category: data.category || 'UTILITY',
      content: data.content,
      headerType: data.headerType || 'NONE',
      headerContent: data.headerContent || null,
      footerText: data.footerText || null,
      buttons: data.buttons || [],
      status: WATemplateStatus.APPROVED, // Auto-approve locally since no real API
      tenantId: tenantId || null
    });

    return template;
  }

  public async updateTemplate(
    id: string,
    data: {
      name?: string;
      language?: string;
      category?: string;
      content?: string;
      headerType?: string;
      headerContent?: string;
      footerText?: string;
      buttons?: any[];
      status?: string;
    }
  ): Promise<WhatsAppTemplate> {
    const template = await WhatsAppTemplate.findByPk(id);
    if (!template) throw new BaseError(ERRORS.NOT_FOUND);

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.language !== undefined) updateData.language = data.language;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.headerType !== undefined) updateData.headerType = data.headerType;
    if (data.headerContent !== undefined) updateData.headerContent = data.headerContent;
    if (data.footerText !== undefined) updateData.footerText = data.footerText;
    if (data.buttons !== undefined) updateData.buttons = data.buttons;
    if (data.status !== undefined) updateData.status = data.status;

    await template.update(updateData);
    return template;
  }

  public async deleteTemplate(id: string): Promise<void> {
    const template = await WhatsAppTemplate.findByPk(id);
    if (!template) throw new BaseError(ERRORS.NOT_FOUND);
    await template.destroy();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ANALYTICS
  // ═══════════════════════════════════════════════════════════════════════════

  public async getAnalytics(tenantId: string | null, dateRange?: { start: string; end: string }): Promise<any> {
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;

    if (dateRange?.start && dateRange?.end) {
      where.createdAt = {
        [Op.between]: [new Date(dateRange.start), new Date(dateRange.end)]
      };
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);

    // Total contacts
    const contactWhere: any = {};
    if (tenantId) contactWhere.tenantId = tenantId;
    const totalContacts = await WhatsAppContact.count({ where: contactWhere });
    const activeContacts = await WhatsAppContact.count({
      where: { ...contactWhere, status: WAContactStatus.ACTIVE }
    });

    // Messages today
    const todayWhere: any = { ...where };
    delete todayWhere.createdAt;
    todayWhere.createdAt = { [Op.gte]: todayStart };
    const messagesToday = await WhatsAppMessage.count({ where: todayWhere });

    // Messages this week
    const weekWhere: any = { ...where };
    delete weekWhere.createdAt;
    weekWhere.createdAt = { [Op.gte]: weekStart };
    const messagesThisWeek = await WhatsAppMessage.count({ where: weekWhere });

    // Sent vs received
    const sentWhere: any = { ...where };
    sentWhere.direction = WAMessageDirection.OUTBOUND;
    const totalSent = await WhatsAppMessage.count({ where: sentWhere });

    const receivedWhere: any = { ...where };
    receivedWhere.direction = WAMessageDirection.INBOUND;
    const totalReceived = await WhatsAppMessage.count({ where: receivedWhere });

    // Failed messages
    const failedWhere: any = { ...where };
    failedWhere.status = WAMessageStatus.FAILED;
    const totalFailed = await WhatsAppMessage.count({ where: failedWhere });

    // Template usage
    const templateWhere: any = { ...where };
    templateWhere.type = WAMessageType.TEMPLATE;
    const templateMessages = await WhatsAppMessage.count({ where: templateWhere });

    // Total templates
    const templateCountWhere: any = {};
    if (tenantId) templateCountWhere.tenantId = tenantId;
    const totalTemplates = await WhatsAppTemplate.count({ where: templateCountWhere });

    // Unread messages
    const unreadWhere: any = { ...where };
    unreadWhere.direction = WAMessageDirection.INBOUND;
    unreadWhere.status = { [Op.ne]: WAMessageStatus.READ };
    const unreadMessages = await WhatsAppMessage.count({ where: unreadWhere });

    // Response rate (messages that got a reply)
    const responseRate = totalReceived > 0
      ? Math.round((totalSent / totalReceived) * 100)
      : 0;

    return {
      totalContacts,
      activeContacts,
      messagesToday,
      messagesThisWeek,
      totalSent,
      totalReceived,
      totalFailed,
      templateMessages,
      totalTemplates,
      unreadMessages,
      responseRate: Math.min(responseRate, 100)
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  private async getMessageById(id: string): Promise<WhatsAppMessage> {
    const message = await WhatsAppMessage.findByPk(id, {
      include: [
        { model: User, as: 'sender', attributes: ['id', 'name', 'profilePicture'], required: false },
        { model: WhatsAppContact, as: 'contact', attributes: ['id', 'phoneNumber', 'name'], required: false }
      ]
    });
    if (!message) throw new BaseError(ERRORS.NOT_FOUND);
    return message;
  }
}

export default new WhatsAppService();
