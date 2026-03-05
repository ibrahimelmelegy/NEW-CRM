import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { wrapResult } from '../utils/response/responseWrapper';
import service from './liveChatService';

class LiveChatController {
  // ───────── Conversations ─────────────────────────────────────────────────

  async createConversation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId!;
      const result = await service.createConversation(req.body, tenantId);
      wrapResult(res, result, 201);
    } catch (e) {
      next(e);
    }
  }

  async getConversations(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId!;
      const result = await service.getConversations(req.query, tenantId);
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  async getConversation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await service.getConversationById(Number(req.params.id));
      if (!result) return res.status(404).send({ success: false, message: 'Conversation not found' });
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  async updateConversation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await service.updateConversation(Number(req.params.id), req.body);
      if (!result) return res.status(404).send({ success: false, message: 'Conversation not found' });
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  async deleteConversation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const deleted = await service.deleteConversation(Number(req.params.id));
      if (!deleted) return res.status(404).send({ success: false, message: 'Conversation not found' });
      wrapResult(res, { deleted: true });
    } catch (e) {
      next(e);
    }
  }

  // ───────── Messages ──────────────────────────────────────────────────────

  async sendMessage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId!;
      const user = req.user as any;

      // Enrich with sender info if the sender is an agent
      const data = { ...req.body };
      if (data.senderType === 'STAFF' && user) {
        data.senderId = data.senderId || String(user.id);
        data.senderName = data.senderName || user.name;
      }

      const result = await service.sendMessage(data, tenantId);
      wrapResult(res, result, 201);
    } catch (e) {
      next(e);
    }
  }

  async getMessages(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await service.getMessages(Number(req.params.conversationId), req.query);
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  async markAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user as any;
      const readerId = String(user?.id || '');
      const result = await service.markMessagesAsRead(Number(req.params.conversationId), readerId);
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  // ───────── Agent Assignment ──────────────────────────────────────────────

  async assignAgent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { agentId } = req.body;
      if (!agentId) return res.status(400).send({ success: false, message: 'agentId is required' });
      const result = await service.assignAgent(Number(req.params.id), agentId);
      if (!result) return res.status(404).send({ success: false, message: 'Conversation not found' });
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  async autoAssign(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId!;
      if (!tenantId) return res.status(400).send({ success: false, message: 'Tenant context required' });
      const result = await service.autoAssignAgent(Number(req.params.id), tenantId);
      if (!result) return res.status(404).send({ success: false, message: 'No agents available' });
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  async transferConversation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { toAgentId } = req.body;
      const fromAgentId = req.user!.id;
      if (!toAgentId) return res.status(400).send({ success: false, message: 'toAgentId is required' });
      const result = await service.transferConversation(Number(req.params.id), fromAgentId, toAgentId);
      if (!result) return res.status(404).send({ success: false, message: 'Conversation not found' });
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  // ───────── Resolve / Close ───────────────────────────────────────────────

  async resolveConversation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { resolution } = req.body;
      const result = await service.resolveConversation(Number(req.params.id), resolution);
      if (!result) return res.status(404).send({ success: false, message: 'Conversation not found' });
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  async closeConversation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await service.closeConversation(Number(req.params.id));
      if (!result) return res.status(404).send({ success: false, message: 'Conversation not found' });
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  // ───────── Rating ────────────────────────────────────────────────────────

  async rateConversation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { rating, feedback } = req.body;
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).send({ success: false, message: 'Rating must be 1-5' });
      }
      const result = await service.rateConversation(Number(req.params.id), rating, feedback);
      if (!result) return res.status(404).send({ success: false, message: 'Conversation not found' });
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  // ───────── Canned Responses ──────────────────────────────────────────────

  async getCannedResponses(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId || '';
      const responses = await service.getCannedResponses(tenantId);
      wrapResult(res, responses);
    } catch (e) {
      next(e);
    }
  }

  // ───────── Queue ─────────────────────────────────────────────────────────

  async getQueuePosition(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await service.getQueuePosition(Number(req.params.id));
      if (!result) return res.status(404).send({ success: false, message: 'Conversation not found' });
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  async getWaitingQueue(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId || '';
      const queue = await service.getWaitingQueue(tenantId);
      wrapResult(res, queue);
    } catch (e) {
      next(e);
    }
  }

  // ───────── Unread Count ──────────────────────────────────────────────────

  async getUnreadCount(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user as any;
      const tenantId = user?.tenantId || '';
      const count = await service.getUnreadCountForAgent(user?.id, tenantId);
      wrapResult(res, { unreadCount: count });
    } catch (e) {
      next(e);
    }
  }

  // ───────── Metrics ───────────────────────────────────────────────────────

  async getMetrics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId || '';
      const metrics = await service.getChatMetrics(tenantId);
      wrapResult(res, metrics);
    } catch (e) {
      next(e);
    }
  }
}

export default new LiveChatController();
