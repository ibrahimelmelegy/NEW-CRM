import { Op, fn, col, literal } from 'sequelize';
import { ChatConversation, ChatMessage } from './liveChatModel';
import User from '../user/userModel';
import Client from '../client/clientModel';
import { clampPagination } from '../utils/pagination';
import { io } from '../server';

class LiveChatService {
  // ───────── Conversation CRUD ─────────────────────────────────────────────

  async createConversation(data: any, tenantId?: string) {
    const conversation = await ChatConversation.create({
      ...data,
      tenantId,
      startedAt: new Date(),
      status: data.status || 'OPEN',
      channel: data.channel || 'WEB',
      priority: data.priority || 'NORMAL'
    });

    // Broadcast to all agents so their conversation list updates
    io.emit('chat:new_conversation', {
      id: conversation.id,
      visitorName: conversation.visitorName,
      status: conversation.status,
      channel: conversation.channel
    });

    return conversation;
  }

  async getConversations(query: any, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.status) where.status = query.status;
    if (query.staffId) where.staffId = query.staffId;
    if (query.channel) where.channel = query.channel;
    if (query.priority) where.priority = query.priority;
    if (query.search) {
      where[Op.or] = [
        { subject: { [Op.iLike]: `%${query.search}%` } },
        { visitorName: { [Op.iLike]: `%${query.search}%` } },
        { visitorEmail: { [Op.iLike]: `%${query.search}%` } }
      ];
    }

    try {
      const { rows, count } = await ChatConversation.findAndCountAll({
        where,
        include: [
          { model: Client, as: 'client', attributes: ['id', 'name', 'email'], required: false },
          { model: User, as: 'staff', attributes: ['id', 'name', 'email'], required: false }
        ],
        order: [['updatedAt', 'DESC']],
        limit,
        offset,
        distinct: true
      });

      return {
        docs: rows,
        pagination: {
          page,
          limit,
          totalItems: count,
          totalPages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      return {
        docs: [],
        pagination: { page: 1, limit: 10, totalItems: 0, totalPages: 0 }
      };
    }
  }

  async getConversationById(id: number) {
    return ChatConversation.findByPk(id, {
      include: [
        { model: Client, as: 'client', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'staff', attributes: ['id', 'name', 'email'] }
      ]
    });
  }

  async updateConversation(id: number, data: any) {
    const conv = await ChatConversation.findByPk(id);
    if (!conv) return null;

    // Track status transitions
    const previousStatus = conv.status;
    await conv.update(data);

    // If status changed to RESOLVED, set resolvedAt
    if (data.status === 'RESOLVED' && previousStatus !== 'RESOLVED') {
      await conv.update({ resolvedAt: new Date() });
    }

    // Broadcast status changes
    if (data.status && data.status !== previousStatus) {
      io.to(`conversation:${id}`).emit('chat:status_changed', {
        conversationId: id,
        previousStatus,
        newStatus: data.status
      });
      io.emit('chat:conversation_updated', { conversationId: id, status: data.status });
    }

    return conv;
  }

  async deleteConversation(id: number) {
    await ChatMessage.destroy({ where: { conversationId: id } });
    const conv = await ChatConversation.findByPk(id);
    if (!conv) return false;
    await conv.destroy();
    io.emit('chat:conversation_deleted', { conversationId: id });
    return true;
  }

  // ───────── Message CRUD ──────────────────────────────────────────────────

  async sendMessage(data: any, tenantId?: string) {
    const message = await ChatMessage.create({ ...data, tenantId });

    // Update conversation counters and lastMessage
    await ChatConversation.update(
      {
        messageCount: literal('"messageCount" + 1'),
        lastMessage: data.content?.substring(0, 200) || '',
        unreadCount: data.senderType !== 'STAFF' ? literal('"unreadCount" + 1') : literal('"unreadCount"')
      },
      { where: { id: data.conversationId } }
    );

    // If first STAFF message and conversation is OPEN, transition to ACTIVE
    if (data.senderType === 'STAFF') {
      const conv = await ChatConversation.findByPk(data.conversationId);
      if (conv && conv.status === 'OPEN') {
        await conv.update({ status: 'ACTIVE' });
        io.emit('chat:conversation_updated', {
          conversationId: data.conversationId,
          status: 'ACTIVE'
        });
      }
    }

    // Emit to the conversation room for real-time delivery
    const messagePayload = {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      senderName: message.senderName,
      senderType: message.senderType,
      content: message.content,
      messageType: message.messageType,
      fileUrl: message.fileUrl,
      fileName: message.fileName,
      isRead: message.isRead,
      createdAt: message.createdAt
    };

    io.to(`conversation:${data.conversationId}`).emit('chat:message', messagePayload);

    // Also emit globally for conversation list updates
    io.emit('chat:message_sent', {
      conversationId: data.conversationId,
      messageId: message.id,
      senderType: data.senderType,
      content: data.content?.substring(0, 100)
    });

    return message;
  }

  async getMessages(conversationId: number, query: any) {
    const { page, limit, offset } = clampPagination(query, 50);
    const { rows, count } = await ChatMessage.findAndCountAll({
      where: { conversationId },
      order: [['createdAt', 'ASC']],
      limit,
      offset
    });
    return {
      docs: rows,
      pagination: {
        page,
        limit,
        totalItems: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  async markMessagesAsRead(conversationId: number, readerId: string) {
    const now = new Date();
    const [updated] = await ChatMessage.update(
      { isRead: true, readAt: now },
      {
        where: {
          conversationId,
          isRead: false,
          senderId: { [Op.ne]: readerId }
        }
      }
    );

    // Reset unread counter on the conversation
    if (updated > 0) {
      await ChatConversation.update({ unreadCount: 0 }, { where: { id: conversationId } });

      io.to(`conversation:${conversationId}`).emit('chat:messages_read', {
        conversationId,
        readerId,
        readAt: now.toISOString(),
        count: updated
      });
    }

    return { updated };
  }

  // ───────── Agent Assignment ──────────────────────────────────────────────

  async assignAgent(conversationId: number, agentId: number) {
    const conv = await ChatConversation.findByPk(conversationId);
    if (!conv) return null;

    const previousAgent = conv.staffId;
    const updateData: Record<string, any> = { staffId: agentId };
    if (conv.status === 'WAITING' || conv.status === 'OPEN') {
      updateData.status = 'ACTIVE';
    }

    await conv.update(updateData);

    // Fetch agent info for the event payload
    const agent = await User.findByPk(agentId, { attributes: ['id', 'name', 'email'] });

    io.to(`conversation:${conversationId}`).emit('chat:assigned', {
      conversationId,
      agentId,
      agentName: agent?.name || 'Unknown',
      previousAgentId: previousAgent,
      status: conv.status
    });

    io.emit('chat:conversation_updated', {
      conversationId,
      staffId: agentId,
      status: conv.status
    });

    // Create a system message noting the assignment
    await this.sendMessage(
      {
        conversationId,
        senderType: 'SYSTEM',
        content: `Conversation assigned to ${agent?.name || 'Agent #' + agentId}`,
        messageType: 'SYSTEM'
      },
      conv.tenantId
    );

    return conv;
  }

  async autoAssignAgent(conversationId: number, tenantId: string) {
    const conv = await ChatConversation.findByPk(conversationId);
    if (!conv) return null;

    // Find all staff users for this tenant
    const agents = await User.findAll({
      where: { tenantId },
      attributes: ['id', 'name', 'email']
    });

    if (agents.length === 0) return null;

    // Count active conversations per agent, pick least loaded
    let leastLoadedAgent = agents[0];
    let minConversations = Infinity;

    for (const agent of agents) {
      const activeCount = await ChatConversation.count({
        where: {
          tenantId,
          staffId: agent.id,
          status: { [Op.in]: ['OPEN', 'ACTIVE', 'WAITING'] }
        }
      });

      if (activeCount < minConversations) {
        minConversations = activeCount;
        leastLoadedAgent = agent;
      }
    }

    return this.assignAgent(conversationId, leastLoadedAgent.id);
  }

  // ───────── Transfer ──────────────────────────────────────────────────────

  async transferConversation(conversationId: number, fromAgentId: number, toAgentId: number) {
    const conv = await ChatConversation.findByPk(conversationId);
    if (!conv) return null;

    const toAgent = await User.findByPk(toAgentId, { attributes: ['id', 'name', 'email'] });
    const fromAgent = await User.findByPk(fromAgentId, { attributes: ['id', 'name', 'email'] });

    await conv.update({ staffId: toAgentId });

    // System message
    await this.sendMessage(
      {
        conversationId,
        senderType: 'SYSTEM',
        content: `Conversation transferred from ${fromAgent?.name || 'Agent'} to ${toAgent?.name || 'Agent'}`,
        messageType: 'SYSTEM'
      },
      conv.tenantId
    );

    io.to(`conversation:${conversationId}`).emit('chat:transferred', {
      conversationId,
      fromAgentId,
      fromAgentName: fromAgent?.name,
      toAgentId,
      toAgentName: toAgent?.name
    });

    io.emit('chat:conversation_updated', {
      conversationId,
      staffId: toAgentId
    });

    return conv;
  }

  // ───────── Resolve / Close ───────────────────────────────────────────────

  async resolveConversation(conversationId: number, resolution?: string) {
    const conv = await ChatConversation.findByPk(conversationId);
    if (!conv) return null;
    if (conv.status === 'RESOLVED' || conv.status === 'CLOSED') return conv;

    const resolvedAt = new Date();
    const createdAt = new Date(conv.createdAt);
    const resolutionTimeMinutes = Math.round((resolvedAt.getTime() - createdAt.getTime()) / 60000);

    // Calculate first response time
    let firstResponseTimeMinutes: number | null = null;
    const firstStaffMessage = await ChatMessage.findOne({
      where: { conversationId, senderType: 'STAFF' },
      order: [['createdAt', 'ASC']]
    });
    if (firstStaffMessage) {
      firstResponseTimeMinutes = Math.round((new Date(firstStaffMessage.createdAt).getTime() - createdAt.getTime()) / 60000);
    }

    await conv.update({ status: 'RESOLVED', resolvedAt });

    if (resolution) {
      await this.sendMessage(
        {
          conversationId,
          senderType: 'SYSTEM',
          content: `Conversation resolved: ${resolution}`,
          messageType: 'SYSTEM'
        },
        conv.tenantId
      );
    }

    io.to(`conversation:${conversationId}`).emit('chat:resolved', {
      conversationId,
      resolvedAt: resolvedAt.toISOString(),
      resolutionTimeMinutes,
      firstResponseTimeMinutes
    });

    io.emit('chat:conversation_updated', { conversationId, status: 'RESOLVED' });

    return {
      conversation: conv,
      resolvedAt,
      resolutionTimeMinutes,
      firstResponseTimeMinutes
    };
  }

  async closeConversation(conversationId: number) {
    const conv = await ChatConversation.findByPk(conversationId);
    if (!conv) return null;
    if (conv.status === 'CLOSED') return conv;

    if (!conv.resolvedAt) {
      conv.resolvedAt = new Date();
    }

    await conv.update({ status: 'CLOSED', resolvedAt: conv.resolvedAt });

    io.to(`conversation:${conversationId}`).emit('chat:closed', { conversationId });
    io.emit('chat:conversation_updated', { conversationId, status: 'CLOSED' });

    return conv;
  }

  // ───────── Rating / Feedback ─────────────────────────────────────────────

  async rateConversation(conversationId: number, rating: number, feedback?: string) {
    const conv = await ChatConversation.findByPk(conversationId);
    if (!conv) return null;

    await conv.update({ rating, feedback: feedback || null });
    return conv;
  }

  // ───────── Canned Responses ──────────────────────────────────────────────

  async getCannedResponses(tenantId: string) {
    // Fetch from the first conversation with canned responses, or return defaults
    const conv = await ChatConversation.findOne({
      where: { tenantId, cannedResponses: { [Op.ne]: null } },
      attributes: ['cannedResponses']
    });

    const defaults = [
      { id: '1', label: 'Greeting', text: 'Hello! How can I help you today?' },
      { id: '2', label: 'Transfer', text: 'Let me transfer you to a specialist who can better assist you.' },
      { id: '3', label: 'Follow-up', text: 'I will follow up on this and get back to you shortly.' },
      { id: '4', label: 'Closing', text: 'Thank you for contacting us! Is there anything else I can help with?' },
      { id: '5', label: 'Hold', text: 'Please hold on for a moment while I look into this for you.' }
    ];

    return conv?.cannedResponses?.length ? conv.cannedResponses : defaults;
  }

  // ───────── Unread Counts ─────────────────────────────────────────────────

  async getUnreadCountForAgent(agentId: number, tenantId: string) {
    const result = await ChatConversation.sum('unreadCount', {
      where: {
        tenantId,
        staffId: agentId,
        status: { [Op.in]: ['OPEN', 'ACTIVE', 'WAITING'] }
      }
    });
    return result || 0;
  }

  // ───────── Queue Management ──────────────────────────────────────────────

  async getQueuePosition(conversationId: number) {
    const conv = await ChatConversation.findByPk(conversationId);
    if (!conv) return null;

    if (conv.status !== 'WAITING') {
      return {
        conversationId,
        status: conv.status,
        position: 0,
        message: 'Conversation is not in the waiting queue'
      };
    }

    const aheadCount = await ChatConversation.count({
      where: {
        tenantId: conv.tenantId,
        status: 'WAITING',
        createdAt: { [Op.lt]: conv.createdAt }
      }
    });

    return {
      conversationId,
      status: 'WAITING',
      position: aheadCount + 1,
      aheadInQueue: aheadCount
    };
  }

  async getWaitingQueue(tenantId: string) {
    const waiting = await ChatConversation.findAll({
      where: { tenantId, status: 'WAITING' },
      include: [{ model: Client, as: 'client', attributes: ['id', 'name', 'email'] }],
      order: [['createdAt', 'ASC']]
    });
    return waiting;
  }

  // ───────── Analytics / Metrics ───────────────────────────────────────────

  async getChatMetrics(tenantId: string) {
    // Active conversations count
    const activeConversations = await ChatConversation.count({
      where: { tenantId, status: { [Op.in]: ['OPEN', 'ACTIVE'] } }
    });

    // Waiting in queue
    const waitingInQueue = await ChatConversation.count({
      where: { tenantId, status: 'WAITING' }
    });

    // Today's conversations
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todayConversations = await ChatConversation.count({
      where: { tenantId, createdAt: { [Op.gte]: startOfDay } }
    });

    // Total closed
    const totalClosed = await ChatConversation.count({
      where: { tenantId, status: { [Op.in]: ['RESOLVED', 'CLOSED'] } }
    });

    // Calculate avg response time from resolved/closed conversations
    const closedConvos = await ChatConversation.findAll({
      where: { tenantId, status: { [Op.in]: ['RESOLVED', 'CLOSED'] } },
      attributes: ['id', 'createdAt', 'resolvedAt', 'updatedAt'],
      order: [['updatedAt', 'DESC']],
      limit: 100 // Sample last 100 for performance
    });

    let totalResponseTimeMs = 0;
    let responseTimeCount = 0;
    let totalResolutionTimeMs = 0;
    let resolutionTimeCount = 0;

    for (const conv of closedConvos) {
      const createdAt = new Date(conv.createdAt).getTime();
      const closedAt = conv.resolvedAt ? new Date(conv.resolvedAt).getTime() : new Date(conv.updatedAt).getTime();

      if (closedAt > createdAt) {
        totalResolutionTimeMs += closedAt - createdAt;
        resolutionTimeCount++;
      }

      const firstStaffMsg = await ChatMessage.findOne({
        where: { conversationId: conv.id, senderType: 'STAFF' },
        order: [['createdAt', 'ASC']],
        attributes: ['createdAt']
      });

      if (firstStaffMsg) {
        const responseMs = new Date(firstStaffMsg.createdAt).getTime() - createdAt;
        if (responseMs > 0) {
          totalResponseTimeMs += responseMs;
          responseTimeCount++;
        }
      }
    }

    const avgResponseMinutes = responseTimeCount > 0 ? Math.round(totalResponseTimeMs / responseTimeCount / 60000) : 0;
    const avgResolutionMinutes = resolutionTimeCount > 0 ? Math.round(totalResolutionTimeMs / resolutionTimeCount / 60000) : 0;

    // Format as human-readable strings
    const formatDuration = (minutes: number): string => {
      if (minutes === 0) return '0m';
      if (minutes < 60) return `${minutes}m`;
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return m > 0 ? `${h}h ${m}m` : `${h}h`;
    };

    // Average satisfaction rating
    const ratedConvos = await ChatConversation.findAll({
      where: { tenantId, rating: { [Op.ne]: null } },
      attributes: ['rating']
    });
    const avgRating = ratedConvos.length > 0 ? (ratedConvos.reduce((sum, c) => sum + (c.rating || 0), 0) / ratedConvos.length).toFixed(1) : null;

    // Conversations per agent
    const agentConversations = (await ChatConversation.findAll({
      where: {
        tenantId,
        staffId: { [Op.ne]: null },
        status: { [Op.in]: ['OPEN', 'ACTIVE', 'WAITING'] }
      },
      attributes: ['staffId', [fn('COUNT', col('id')), 'conversationCount']],
      group: ['staffId'],
      raw: true
    })) as unknown as Array<{ staffId: number; conversationCount: string }>;

    return {
      activeConversations,
      waitingInQueue,
      todayConversations,
      totalClosed,
      avgResponseTime: formatDuration(avgResponseMinutes),
      avgResolutionTime: formatDuration(avgResolutionMinutes),
      avgResponseMinutes,
      avgResolutionMinutes,
      avgRating,
      conversationsPerAgent: agentConversations.map(a => ({
        staffId: a.staffId,
        activeConversations: Number(a.conversationCount)
      }))
    };
  }
}

export default new LiveChatService();
