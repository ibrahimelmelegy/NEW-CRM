import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { wrapResult } from '../utils/response/responseWrapper';
import whatsappService from './whatsappService';
import { io } from '../server';
import { WhatsAppMessage } from './whatsappModel';

class WhatsAppController {
  // ═══════════════════════════════════════════════════════════════════════════
  // CONTACTS
  // ═══════════════════════════════════════════════════════════════════════════

  public async getContacts(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req.user as any)?.tenantId || null;
      const { page, limit, search, status, tags } = req.query;
      const result = await whatsappService.getContacts(tenantId, {
        page: Number(page) || 1,
        limit: Number(limit) || 25,
        search: search as string,
        status: status as string,
        tags: tags ? (Array.isArray(tags) ? tags as string[] : [tags as string]) : undefined
      });
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async getContactById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const contact = await whatsappService.getContactById(id);
      wrapResult(res, contact);
    } catch (error) {
      next(error);
    }
  }

  public async createContact(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req.user as any)?.tenantId || null;
      const contact = await whatsappService.createContact(req.body, tenantId);
      io.emit('whatsapp:contact_created', { id: contact.id, name: contact.name });
      wrapResult(res, contact, 201);
    } catch (error) {
      next(error);
    }
  }

  public async updateContact(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const contact = await whatsappService.updateContact(id, req.body);
      io.emit('whatsapp:contact_updated', { id: contact.id });
      wrapResult(res, contact);
    } catch (error) {
      next(error);
    }
  }

  public async deleteContact(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      await whatsappService.deleteContact(id);
      io.emit('whatsapp:contact_deleted', { id });
      wrapResult(res, { deleted: true });
    } catch (error) {
      next(error);
    }
  }

  public async importFromClients(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req.user as any)?.tenantId || null;
      const result = await whatsappService.importFromClients(tenantId);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MESSAGES
  // ═══════════════════════════════════════════════════════════════════════════

  public async getMessages(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const contactId = req.params.contactId as string;
      const { page, limit } = req.query;
      const result = await whatsappService.getMessages(contactId, {
        page: Number(page) || 1,
        limit: Number(limit) || 50
      });
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async sendTextMessage(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.user as any)?.id;
      const tenantId = (req.user as any)?.tenantId || null;
      const { contactId, content } = req.body;

      if (!contactId || !content) {
        res.status(400).json({ message: 'contactId and content are required' });
        return;
      }

      const message = await whatsappService.sendTextMessage(contactId, content, userId, tenantId);
      io.emit('whatsapp:message_sent', {
        id: message.id,
        contactId: message.contactId,
        content: message.content,
        direction: message.direction
      });
      wrapResult(res, message, 201);
    } catch (error) {
      next(error);
    }
  }

  public async sendMediaMessage(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.user as any)?.id;
      const tenantId = (req.user as any)?.tenantId || null;
      const { contactId, content, type, mediaUrl, mediaCaption, fileName } = req.body;

      if (!contactId || !mediaUrl) {
        res.status(400).json({ message: 'contactId and mediaUrl are required' });
        return;
      }

      const message = await whatsappService.sendMediaMessage(
        contactId,
        { content: content || '', type, mediaUrl, mediaCaption, fileName },
        userId,
        tenantId
      );
      io.emit('whatsapp:message_sent', {
        id: message.id,
        contactId: message.contactId,
        type: message.type,
        direction: message.direction
      });
      wrapResult(res, message, 201);
    } catch (error) {
      next(error);
    }
  }

  public async sendTemplateMessage(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.user as any)?.id;
      const tenantId = (req.user as any)?.tenantId || null;
      const { contactId, templateId, variables } = req.body;

      if (!contactId || !templateId) {
        res.status(400).json({ message: 'contactId and templateId are required' });
        return;
      }

      const message = await whatsappService.sendTemplateMessage(
        contactId, templateId, variables || {}, userId, tenantId
      );
      io.emit('whatsapp:message_sent', {
        id: message.id,
        contactId: message.contactId,
        type: 'TEMPLATE',
        direction: message.direction
      });
      wrapResult(res, message, 201);
    } catch (error) {
      next(error);
    }
  }

  public async markAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const contactId = req.params.contactId as string;
      await whatsappService.markAsRead(contactId);
      io.emit('whatsapp:messages_read', { contactId });
      wrapResult(res, { success: true });
    } catch (error) {
      next(error);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BULK
  // ═══════════════════════════════════════════════════════════════════════════

  public async sendBulkTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.user as any)?.id;
      const tenantId = (req.user as any)?.tenantId || null;
      const { contactIds, templateId, variables } = req.body;

      if (!contactIds?.length || !templateId) {
        res.status(400).json({ message: 'contactIds array and templateId are required' });
        return;
      }

      const result = await whatsappService.sendBulkTemplate(
        contactIds, templateId, variables || {}, userId, tenantId
      );
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TEMPLATES
  // ═══════════════════════════════════════════════════════════════════════════

  public async getTemplates(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req.user as any)?.tenantId || null;
      const { page, limit, search, category, status } = req.query;
      const result = await whatsappService.getTemplates(tenantId, {
        page: Number(page) || 1,
        limit: Number(limit) || 25,
        search: search as string,
        category: category as string,
        status: status as string
      });
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async getTemplateById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const template = await whatsappService.getTemplateById(id);
      wrapResult(res, template);
    } catch (error) {
      next(error);
    }
  }

  public async createTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req.user as any)?.tenantId || null;
      const template = await whatsappService.createTemplate(req.body, tenantId);
      wrapResult(res, template, 201);
    } catch (error) {
      next(error);
    }
  }

  public async updateTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const template = await whatsappService.updateTemplate(id, req.body);
      wrapResult(res, template);
    } catch (error) {
      next(error);
    }
  }

  public async deleteTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      await whatsappService.deleteTemplate(id);
      wrapResult(res, { deleted: true });
    } catch (error) {
      next(error);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ANALYTICS
  // ═══════════════════════════════════════════════════════════════════════════

  public async getAnalytics(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req.user as any)?.tenantId || null;
      const dateRange = req.query.start && req.query.end
        ? { start: req.query.start as string, end: req.query.end as string }
        : undefined;
      const analytics = await whatsappService.getAnalytics(tenantId, dateRange);
      wrapResult(res, analytics);
    } catch (error) {
      next(error);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // WEBHOOK (Public - WhatsApp Cloud API format)
  // ═══════════════════════════════════════════════════════════════════════════

  public async webhookVerify(req: any, res: Response): Promise<void> {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_TOKEN) {
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }

  public async webhookIncoming(req: any, res: Response, _next: NextFunction): Promise<void> {
    try {
      const body = req.body;

      // Process WhatsApp Cloud API webhook format
      if (body?.entry) {
        for (const entry of body.entry) {
          const changes = entry.changes || [];
          for (const change of changes) {
            const value = change.value;

            // Handle incoming messages
            if (value?.messages) {
              for (const msg of value.messages) {
                const phoneNumber = msg.from;
                const content = msg.text?.body || msg.caption || '';
                const type = (msg.type || 'text').toUpperCase();
                const metadata: any = {};

                // Extract media URLs based on type
                if (msg.image) metadata.imageId = msg.image.id;
                if (msg.document) {
                  metadata.documentId = msg.document.id;
                  metadata.fileName = msg.document.filename;
                }
                if (msg.audio) metadata.audioId = msg.audio.id;
                if (msg.video) metadata.videoId = msg.video.id;
                if (msg.location) {
                  metadata.latitude = msg.location.latitude;
                  metadata.longitude = msg.location.longitude;
                }

                const message = await whatsappService.recordInboundMessage(
                  phoneNumber, content, msg.id, type, metadata
                );

                if (message) {
                  io.emit('whatsapp:message_received', {
                    id: message.id,
                    contactId: message.contactId,
                    content: message.content,
                    type: message.type,
                    direction: 'INBOUND'
                  });
                }
              }
            }

            // Handle status updates (sent, delivered, read)
            if (value?.statuses) {
              for (const statusUpdate of value.statuses) {
                const existingMsg = await WhatsAppMessage.findOne({
                  where: { externalId: statusUpdate.id }
                });
                if (existingMsg) {
                  const statusMap: Record<string, string> = {
                    sent: 'SENT',
                    delivered: 'DELIVERED',
                    read: 'READ',
                    failed: 'FAILED'
                  };
                  await existingMsg.update({ status: statusMap[statusUpdate.status] || existingMsg.status });
                  io.emit('whatsapp:status_updated', {
                    messageId: existingMsg.id,
                    contactId: existingMsg.contactId,
                    status: statusMap[statusUpdate.status]
                  });
                }
              }
            }
          }
        }
      }

      // Always respond 200 to webhooks
      res.sendStatus(200);
    } catch (error) {
      // Still respond 200 to prevent webhook retries
      console.error('[WhatsApp Webhook Error]', error);
      res.sendStatus(200);
    }
  }
}

export default new WhatsAppController();
