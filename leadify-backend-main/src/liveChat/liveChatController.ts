import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { wrapResult } from '../utils/response/responseWrapper';
import service from './liveChatService';
import { io } from '../server';

class LiveChatController {
  async createConversation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const result = await service.createConversation(req.body, tenantId);
      io.emit('chat:new_conversation', { id: result.id });
      wrapResult(res, result, 201);
    } catch (e) { next(e); }
  }
  async getConversations(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { wrapResult(res, await service.getConversations(req.query, (req.user as any)?.tenantId)); } catch (e) { next(e); }
  }
  async updateConversation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { wrapResult(res, await service.updateConversation(Number(req.params.id), req.body)); } catch (e) { next(e); }
  }
  async deleteConversation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { await service.deleteConversation(Number(req.params.id)); wrapResult(res, { deleted: true }); } catch (e) { next(e); }
  }
  async sendMessage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const result = await service.sendMessage(req.body, tenantId);
      io.emit('chat:new_message', { conversationId: result.conversationId, id: result.id });
      wrapResult(res, result, 201);
    } catch (e) { next(e); }
  }
  async getMessages(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { wrapResult(res, await service.getMessages(Number(req.params.conversationId), req.query)); } catch (e) { next(e); }
  }
}
export default new LiveChatController();
