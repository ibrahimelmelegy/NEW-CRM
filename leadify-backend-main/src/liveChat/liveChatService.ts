import { Op, fn, col } from 'sequelize';
import { ChatConversation, ChatMessage } from './liveChatModel';
import User from '../user/userModel';
import Client from '../client/clientModel';
import { clampPagination } from '../utils/pagination';
import { io } from '../server';

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
    try { io.emit('chat:message_sent', { conversationId: data.conversationId, messageId: message.id, senderType: data.senderType }); } catch {}
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

  /**
   * Assign a specific agent to a conversation. If the conversation was
   * in WAITING or OPEN status, transition it to ACTIVE.
   */
  async assignAgent(conversationId: number, agentId: number) {
    const conv = await ChatConversation.findByPk(conversationId);
    if (!conv) return null;

    const updateData: any = { staffId: agentId };
    if (conv.status === 'WAITING' || conv.status === 'OPEN') {
      updateData.status = 'ACTIVE';
    }

    await conv.update(updateData);
    try { io.emit('chat:agent_assigned', { conversationId, agentId, status: conv.status }); } catch {}
    return conv;
  }

  /**
   * Auto-assign the agent with the fewest active conversations (least-loaded strategy).
   * Only considers staff users within the same tenant.
   */
  async autoAssignAgent(conversationId: number, tenantId: string) {
    const conv = await ChatConversation.findByPk(conversationId);
    if (!conv) return null;

    // Find all staff users for this tenant
    const agents = await User.findAll({
      where: { tenantId },
      attributes: ['id', 'name', 'email'],
    });

    if (agents.length === 0) return null;

    // Count active conversations per agent
    let leastLoadedAgent = agents[0];
    let minConversations = Infinity;

    for (const agent of agents) {
      const activeCount = await ChatConversation.count({
        where: {
          tenantId,
          staffId: agent.id,
          status: { [Op.in]: ['OPEN', 'ACTIVE', 'WAITING'] },
        },
      });

      if (activeCount < minConversations) {
        minConversations = activeCount;
        leastLoadedAgent = agent;
      }
    }

    // Assign the least-loaded agent
    return this.assignAgent(conversationId, leastLoadedAgent.id);
  }

  /**
   * Close a conversation: set status to CLOSED, record a resolution note,
   * and calculate response time and resolution time from timestamps.
   */
  async closeConversation(conversationId: number, resolution?: string) {
    const conv = await ChatConversation.findByPk(conversationId);
    if (!conv) return null;
    if (conv.status === 'CLOSED') return conv;

    const closedAt = new Date();

    // Calculate resolution time (from conversation creation to close)
    const createdAt = new Date(conv.createdAt);
    const resolutionTimeMs = closedAt.getTime() - createdAt.getTime();
    const resolutionTimeMinutes = Math.round(resolutionTimeMs / 60000);

    // Calculate first response time (time from conversation creation to first staff message)
    let firstResponseTimeMinutes: number | null = null;
    const firstStaffMessage = await ChatMessage.findOne({
      where: { conversationId, senderType: 'STAFF' },
      order: [['createdAt', 'ASC']],
    });

    if (firstStaffMessage) {
      const firstResponseMs = new Date(firstStaffMessage.createdAt).getTime() - createdAt.getTime();
      firstResponseTimeMinutes = Math.round(firstResponseMs / 60000);
    }

    await conv.update({
      status: 'CLOSED',
      subject: resolution ? `${conv.subject || ''} [Resolved: ${resolution}]`.trim() : conv.subject,
    });

    try { io.emit('chat:conversation_closed', { conversationId, resolutionTimeMinutes, firstResponseTimeMinutes }); } catch {}
    return {
      conversation: conv,
      closedAt,
      resolution: resolution || null,
      resolutionTimeMinutes,
      firstResponseTimeMinutes,
    };
  }

  /**
   * Aggregate chat metrics for a tenant: active conversations, average response time,
   * average resolution time, conversations per agent, and overall volume.
   */
  async getChatMetrics(tenantId: string) {
    // Active conversations count
    const activeConversations = await ChatConversation.count({
      where: { tenantId, status: { [Op.in]: ['OPEN', 'ACTIVE', 'WAITING'] } },
    });

    // Closed conversations for metrics calculation
    const closedConversations = await ChatConversation.findAll({
      where: { tenantId, status: 'CLOSED' },
      order: [['updatedAt', 'DESC']],
    });

    // Calculate average response time and resolution time from closed conversations
    let totalResponseTimeMs = 0;
    let responseTimeCount = 0;
    let totalResolutionTimeMs = 0;

    for (const conv of closedConversations) {
      const createdAt = new Date(conv.createdAt);
      const closedAt = new Date(conv.updatedAt);
      totalResolutionTimeMs += closedAt.getTime() - createdAt.getTime();

      // Find first staff message for response time
      const firstStaffMsg = await ChatMessage.findOne({
        where: { conversationId: conv.id, senderType: 'STAFF' },
        order: [['createdAt', 'ASC']],
      });
      if (firstStaffMsg) {
        totalResponseTimeMs += new Date(firstStaffMsg.createdAt).getTime() - createdAt.getTime();
        responseTimeCount++;
      }
    }

    const avgResponseTimeMinutes = responseTimeCount > 0
      ? Math.round(totalResponseTimeMs / responseTimeCount / 60000)
      : 0;
    const avgResolutionTimeMinutes = closedConversations.length > 0
      ? Math.round(totalResolutionTimeMs / closedConversations.length / 60000)
      : 0;

    // Conversations per agent (active conversations grouped by staffId)
    const agentConversations = await ChatConversation.findAll({
      where: { tenantId, staffId: { [Op.ne]: null }, status: { [Op.in]: ['OPEN', 'ACTIVE', 'WAITING'] } },
      attributes: [
        'staffId',
        [fn('COUNT', col('id')), 'conversationCount'],
      ],
      group: ['staffId'],
      raw: true,
    }) as unknown as Array<{ staffId: number; conversationCount: string }>;

    // Total conversations today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todayCount = await ChatConversation.count({
      where: { tenantId, createdAt: { [Op.gte]: startOfDay } },
    });

    // Waiting count
    const waitingCount = await ChatConversation.count({
      where: { tenantId, status: 'WAITING' },
    });

    return {
      activeConversations,
      waitingConversations: waitingCount,
      todayConversations: todayCount,
      totalClosedConversations: closedConversations.length,
      averageResponseTimeMinutes: avgResponseTimeMinutes,
      averageResolutionTimeMinutes: avgResolutionTimeMinutes,
      conversationsPerAgent: agentConversations.map((a) => ({
        staffId: a.staffId,
        activeConversations: Number(a.conversationCount),
      })),
    };
  }

  /**
   * Return the queue position of a WAITING conversation.
   * Position is determined by creation time (FIFO).
   */
  async getQueuePosition(conversationId: number) {
    const conv = await ChatConversation.findByPk(conversationId);
    if (!conv) return null;

    if (conv.status !== 'WAITING') {
      return { conversationId, status: conv.status, position: 0, message: 'Conversation is not in the waiting queue' };
    }

    // Count how many WAITING conversations were created before this one (same tenant)
    const aheadCount = await ChatConversation.count({
      where: {
        tenantId: conv.tenantId,
        status: 'WAITING',
        createdAt: { [Op.lt]: conv.createdAt },
      },
    });

    return {
      conversationId,
      status: 'WAITING',
      position: aheadCount + 1, // 1-based position
      aheadInQueue: aheadCount,
    };
  }
}
export default new LiveChatService();
