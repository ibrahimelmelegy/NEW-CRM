import { Response, NextFunction } from 'express';
import { wrapResult } from '../utils/response/responseWrapper';
import messagingService from './messagingService';
import { AuthenticatedRequest } from '../types';

class MessagingController {
  async sendMessage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { contactPhone, contactName, content, provider } = req.body;
      if (!contactPhone || !content) {
        return res.status(400).json({ message: 'contactPhone and content are required' });
      }

      const message = await messagingService.sendMessage(req.user!.id, contactPhone, contactName, content, provider);
      wrapResult(res, message, 201);
    } catch (error) {
      next(error);
    }
  }

  async getConversations(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const conversations = await messagingService.getConversations(req.user!.id);
      wrapResult(res, conversations);
    } catch (error) {
      next(error);
    }
  }

  async getMessages(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const contactPhone = req.params.contactPhone as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const result = await messagingService.getMessages(req.user!.id, contactPhone, page, limit);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const contactPhone = req.params.contactPhone as string;
      await messagingService.markAsRead(req.user!.id, contactPhone);
      wrapResult(res, { success: true });
    } catch (error) {
      next(error);
    }
  }

  async webhook(req: any, res: Response, next: NextFunction) {
    try {
      // WhatsApp webhook verification (GET)
      if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_TOKEN) {
          return res.status(200).send(challenge);
        }
        return res.sendStatus(403);
      }

      // Incoming message webhook (POST)
      const body = req.body;
      if (body?.entry?.[0]?.changes?.[0]?.value?.messages) {
        const messageData = body.entry[0].changes[0].value.messages[0];
        const contact = body.entry[0].changes[0].value.contacts?.[0];

        await messagingService.recordInboundMessage(messageData.from, messageData.text?.body || '', messageData.id);
      }

      res.sendStatus(200);
    } catch (error) {
      next(error);
    }
  }
}

export default new MessagingController();
