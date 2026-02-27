import { Op } from 'sequelize';
import { ChatConversation, ChatMessage } from './liveChatModel';
import User from '../user/userModel';
import Client from '../client/clientModel';
import { clampPagination } from '../utils/pagination';

class LiveChatService {
  async createConversation(data: any, tenantId?: string) {
    return ChatConversation.create({ ...data, tenantId });
  }

  async getConversations(query: any, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.status) where.status = query.status;
    if (query.staffId) where.staffId = query.staffId;
    if (query.channel) where.channel = query.channel;
    if (query.search) where[Op.or] = [
      { subject: { [Op.iLike]: `%${query.search}%` } },
      { visitorName: { [Op.iLike]: `%${query.search}%` } }
    ];

    const { rows, count } = await ChatConversation.findAndCountAll({
      where,
      include: [
        { model: Client, as: 'client', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'staff', attributes: ['id', 'name', 'email'] }
      ],
      order: [['updatedAt', 'DESC']], limit, offset, distinct: true
    });
    return { docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
  }

  async updateConversation(id: number, data: any) {
    const conv = await ChatConversation.findByPk(id);
    if (!conv) return null;
    await conv.update(data);
    return conv;
  }

  async deleteConversation(id: number) {
    await ChatMessage.destroy({ where: { conversationId: id } });
    const conv = await ChatConversation.findByPk(id);
    if (!conv) return false;
    await conv.destroy();
    return true;
  }

  async sendMessage(data: any, tenantId?: string) {
    const message = await ChatMessage.create({ ...data, tenantId });
    await ChatConversation.increment('messageCount', { where: { id: data.conversationId } });
    return message;
  }

  async getMessages(conversationId: number, query: any) {
    const { page, limit, offset } = clampPagination(query, 50);
    const { rows, count } = await ChatMessage.findAndCountAll({
      where: { conversationId },
      order: [['createdAt', 'ASC']], limit, offset
    });
    return { docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
  }
}
export default new LiveChatService();
