import { Op } from 'sequelize';
import Ticket, { TicketStatus, TicketPriority } from './models/ticketModel';
import TicketMessage from './models/ticketMessageModel';
import TicketCategory from './models/ticketCategoryModel';
import CannedResponse from './models/cannedResponseModel';
import SLAConfig from './models/slaConfigModel';
import User from '../user/userModel';
import Client from '../client/clientModel';
import { IPaginationRes } from '../types';
import BaseError from '../utils/error/base-http-exception';
import { ERRORS } from '../utils/error/errors';
import { clampPagination } from '../utils/pagination';
import { io } from '../server';

class SupportService {
  // ─── Ticket Number Generation ─────────────────────────────────────────
  private async generateTicketNumber(): Promise<string> {
    const lastTicket = await Ticket.findOne({
      order: [['createdAt', 'DESC']],
      attributes: ['ticketNumber']
    });

    let nextNum = 1;
    if (lastTicket && lastTicket.ticketNumber) {
      const match = lastTicket.ticketNumber.match(/TKT-(\d+)/);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }

    return `TKT-${String(nextNum).padStart(4, '0')}`;
  }

  // ─── SLA Calculation ──────────────────────────────────────────────────
  private async calculateSLADeadline(priority: string): Promise<Date | null> {
    const slaConfig = await SLAConfig.findOne({ where: { priority, isActive: true } });
    if (!slaConfig) return null;

    const now = new Date();
    const deadline = new Date(now.getTime() + slaConfig.resolutionTimeHours * 60 * 60 * 1000);
    return deadline;
  }

  // ─── Tickets ──────────────────────────────────────────────────────────
  public async createTicket(data: any): Promise<Ticket> {
    const ticketNumber = await this.generateTicketNumber();
    const priority = data.priority || TicketPriority.MEDIUM;
    const slaDeadline = await this.calculateSLADeadline(priority);

    const ticket = await Ticket.create({
      ...data,
      ticketNumber,
      status: data.status || TicketStatus.OPEN,
      priority,
      slaDeadline
    });
    return ticket;
  }

  public async getTickets(query: any): Promise<IPaginationRes<Ticket>> {
    const { page, limit, offset } = clampPagination(query, 20);
    const { status, priority, assignedTo, categoryId, search, clientId } = query;

    const where: any = {};

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assignedTo) where.assignedTo = assignedTo;
    if (categoryId) where.categoryId = categoryId;
    if (clientId) where.clientId = clientId;

    if (search) {
      where[Op.or] = [
        { subject: { [Op.iLike]: `%${search}%` } },
        { ticketNumber: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }
    const { rows, count } = await Ticket.findAndCountAll({
      where,
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email', 'profilePicture'] },
        { model: Client, as: 'client', attributes: ['id', 'clientName', 'email'] },
        { model: TicketCategory, as: 'category', attributes: ['id', 'name'] }
      ],
      order: [['createdAt', 'DESC']],
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

  public async getTicketById(id: string): Promise<Ticket> {
    const ticket = await Ticket.findByPk(id, {
      include: [
        {
          model: TicketMessage,
          as: 'messages',
          order: [['createdAt', 'ASC']]
        },
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email', 'profilePicture'] },
        { model: Client, as: 'client', attributes: ['id', 'clientName', 'email', 'phoneNumber'] },
        { model: TicketCategory, as: 'category', attributes: ['id', 'name'] }
      ]
    });

    if (!ticket) throw new BaseError(ERRORS.NOT_FOUND);
    return ticket;
  }

  public async updateTicket(id: string, data: any): Promise<Ticket> {
    const ticket = await Ticket.findByPk(id);
    if (!ticket) throw new BaseError(ERRORS.NOT_FOUND);
    await ticket.update(data);
    return ticket;
  }

  // ─── Messages ─────────────────────────────────────────────────────────
  public async addMessage(ticketId: string, data: any): Promise<TicketMessage> {
    const ticket = await Ticket.findByPk(ticketId);
    if (!ticket) throw new BaseError(ERRORS.NOT_FOUND);

    const message = await TicketMessage.create({
      ticketId,
      senderId: data.senderId,
      senderType: data.senderType || 'AGENT',
      body: data.body,
      isInternal: data.isInternal || false,
      attachments: data.attachments || null
    });

    // If ticket was in OPEN status and an agent is responding, move to IN_PROGRESS
    if (ticket.status === TicketStatus.OPEN && data.senderType === 'AGENT' && !data.isInternal) {
      await ticket.update({ status: TicketStatus.IN_PROGRESS });
    }

    return message;
  }

  // ─── Assignment ───────────────────────────────────────────────────────
  public async assignTicket(ticketId: string, userId: string): Promise<Ticket> {
    const ticket = await Ticket.findByPk(ticketId);
    if (!ticket) throw new BaseError(ERRORS.NOT_FOUND);

    const user = await User.findByPk(userId);
    if (!user) throw new BaseError(ERRORS.USER_NOT_FOUND);

    const updateData: Record<string, any> = { assignedTo: userId };

    // Set firstResponseAt on first assignment
    if (!ticket.firstResponseAt) {
      updateData.firstResponseAt = new Date();
    }

    // Move to IN_PROGRESS if still OPEN
    if (ticket.status === TicketStatus.OPEN) {
      updateData.status = TicketStatus.IN_PROGRESS;
    }

    await ticket.update(updateData);
    return this.getTicketById(ticketId);
  }

  // ─── Auto-assign (Round Robin) ────────────────────────────────────────
  public async autoAssign(ticketId: string): Promise<Ticket> {
    const ticket = await Ticket.findByPk(ticketId);
    if (!ticket) throw new BaseError(ERRORS.NOT_FOUND);

    // Find agent with fewest open tickets
    const agents = await User.findAll({
      attributes: ['id', 'name']
    });

    if (!agents.length) throw new BaseError(ERRORS.USER_NOT_FOUND);

    let minCount = Infinity;
    let selectedAgent: any = null;

    for (const agent of agents) {
      const count = await Ticket.count({
        where: {
          assignedTo: agent.id,
          status: { [Op.in]: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.WAITING_CUSTOMER] }
        }
      });

      if (count < minCount) {
        minCount = count;
        selectedAgent = agent;
      }
    }

    if (selectedAgent) {
      return this.assignTicket(ticketId, selectedAgent.id);
    }

    return ticket;
  }

  // ─── Escalation ──────────────────────────────────────────────────────
  /**
   * Escalate a ticket: bumps priority to the next level (MEDIUM->HIGH->URGENT),
   * optionally reassigns to a senior agent, and adds an internal escalation note.
   */
  public async escalateTicket(ticketId: string, data?: { assignTo?: string; reason?: string }): Promise<Ticket> {
    const ticket = await Ticket.findByPk(ticketId);
    if (!ticket) throw new BaseError(ERRORS.NOT_FOUND);

    if (ticket.status === TicketStatus.RESOLVED || ticket.status === TicketStatus.CLOSED) {
      throw new BaseError(400, 400, 'Cannot escalate a resolved or closed ticket');
    }

    // Bump priority
    const priorityLadder = [TicketPriority.LOW, TicketPriority.MEDIUM, TicketPriority.HIGH, TicketPriority.URGENT];
    const currentIndex = priorityLadder.indexOf(ticket.priority as TicketPriority);
    const newPriority = currentIndex < priorityLadder.length - 1 ? priorityLadder[currentIndex + 1] : TicketPriority.URGENT;

    const updateData: Record<string, any> = { priority: newPriority };

    // Recalculate SLA deadline based on new priority
    const newSlaDeadline = await this.calculateSLADeadline(newPriority);
    if (newSlaDeadline) {
      updateData.slaDeadline = newSlaDeadline;
    }

    // Reassign if specified
    if (data?.assignTo) {
      const user = await User.findByPk(data.assignTo);
      if (!user) throw new BaseError(ERRORS.USER_NOT_FOUND);
      updateData.assignedTo = data.assignTo;
    }

    await ticket.update(updateData);

    // Add an internal escalation note
    const reason = data?.reason || 'Ticket escalated';
    await TicketMessage.create({
      ticketId,
      senderId: null,
      senderType: 'SYSTEM',
      body: `[ESCALATION] Priority changed to ${newPriority}. Reason: ${reason}`,
      isInternal: true
    });

    try {
      io.emit('ticket:escalated', {
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        previousPriority: priorityLadder[currentIndex],
        newPriority,
        assignedTo: updateData.assignedTo || ticket.assignedTo
      });
    } catch {}

    return this.getTicketById(ticketId);
  }

  // ─── Reopen ─────────────────────────────────────────────────────────
  /**
   * Reopen a resolved or closed ticket. Resets resolvedAt and moves
   * status back to IN_PROGRESS.
   */
  public async reopenTicket(ticketId: string, reason?: string): Promise<Ticket> {
    const ticket = await Ticket.findByPk(ticketId);
    if (!ticket) throw new BaseError(ERRORS.NOT_FOUND);

    if (ticket.status !== TicketStatus.RESOLVED && ticket.status !== TicketStatus.CLOSED) {
      throw new BaseError(400, 400, `Cannot reopen ticket with status "${ticket.status}". Only RESOLVED or CLOSED tickets can be reopened.`);
    }

    await ticket.update({
      status: TicketStatus.IN_PROGRESS,
      resolvedAt: null
    });

    // Add an internal note documenting the reopen
    await TicketMessage.create({
      ticketId,
      senderId: null,
      senderType: 'SYSTEM',
      body: `[REOPENED] ${reason || 'Ticket reopened by agent'}`,
      isInternal: true
    });

    try {
      io.emit('ticket:reopened', { ticketId: ticket.id, ticketNumber: ticket.ticketNumber });
    } catch {}
    return this.getTicketById(ticketId);
  }

  // ─── SLA Compliance Report ──────────────────────────────────────────
  /**
   * Generate a detailed SLA compliance report.
   * Returns compliance rates by priority, breach trends, and at-risk tickets.
   */
  public async getSLAComplianceReport(): Promise<any> {
    // Per-priority compliance
    const priorities = Object.values(TicketPriority);
    const complianceByPriority: Record<string, { total: number; compliant: number; breached: number; rate: number }> = {};

    for (const priority of priorities) {
      const ticketsWithSLA = await Ticket.findAll({
        where: {
          priority,
          slaDeadline: { [Op.ne]: null },
          resolvedAt: { [Op.ne]: null }
        },
        attributes: ['slaDeadline', 'resolvedAt']
      });

      const total = ticketsWithSLA.length;
      const compliant = ticketsWithSLA.filter(t => new Date(t.resolvedAt!) <= new Date(t.slaDeadline!)).length;
      const breached = total - compliant;

      complianceByPriority[priority] = {
        total,
        compliant,
        breached,
        rate: total > 0 ? Math.round((compliant / total) * 10000) / 100 : 100
      };
    }

    // Currently breached (open tickets past SLA deadline)
    const currentlyBreached = await Ticket.findAll({
      where: {
        slaDeadline: { [Op.lt]: new Date() },
        resolvedAt: { [Op.eq]: null },
        status: { [Op.notIn]: [TicketStatus.RESOLVED, TicketStatus.CLOSED] }
      },
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
        { model: Client, as: 'client', attributes: ['id', 'clientName'] }
      ],
      order: [['slaDeadline', 'ASC']]
    });

    // At-risk (within 4 hours of breach)
    const atRiskThreshold = new Date(Date.now() + 4 * 60 * 60 * 1000);
    const atRisk = await Ticket.findAll({
      where: {
        slaDeadline: { [Op.between]: [new Date(), atRiskThreshold] },
        resolvedAt: { [Op.eq]: null },
        status: { [Op.notIn]: [TicketStatus.RESOLVED, TicketStatus.CLOSED] }
      },
      include: [{ model: User, as: 'assignee', attributes: ['id', 'name', 'email'] }],
      order: [['slaDeadline', 'ASC']]
    });

    // Overall compliance
    const allWithSLA = await Ticket.findAll({
      where: { slaDeadline: { [Op.ne]: null }, resolvedAt: { [Op.ne]: null } },
      attributes: ['slaDeadline', 'resolvedAt']
    });
    const overallTotal = allWithSLA.length;
    const overallCompliant = allWithSLA.filter(t => new Date(t.resolvedAt!) <= new Date(t.slaDeadline!)).length;

    return {
      overall: {
        total: overallTotal,
        compliant: overallCompliant,
        breached: overallTotal - overallCompliant,
        complianceRate: overallTotal > 0 ? Math.round((overallCompliant / overallTotal) * 10000) / 100 : 100
      },
      byPriority: complianceByPriority,
      currentlyBreached: currentlyBreached.map(t => ({
        id: t.id,
        ticketNumber: t.ticketNumber,
        subject: t.subject,
        priority: t.priority,
        slaDeadline: t.slaDeadline,
        breachedByHours: Math.round(((Date.now() - new Date(t.slaDeadline!).getTime()) / (1000 * 60 * 60)) * 10) / 10,
        assignee: t.assignee,
        client: t.client
      })),
      atRisk: atRisk.map(t => ({
        id: t.id,
        ticketNumber: t.ticketNumber,
        subject: t.subject,
        priority: t.priority,
        slaDeadline: t.slaDeadline,
        hoursRemaining: Math.round(((new Date(t.slaDeadline!).getTime() - Date.now()) / (1000 * 60 * 60)) * 10) / 10,
        assignee: t.assignee
      })),
      breachedCount: currentlyBreached.length,
      atRiskCount: atRisk.length
    };
  }

  // ─── Resolve & Close ──────────────────────────────────────────────────
  public async resolveTicket(ticketId: string): Promise<Ticket> {
    const ticket = await Ticket.findByPk(ticketId);
    if (!ticket) throw new BaseError(ERRORS.NOT_FOUND);

    await ticket.update({
      status: TicketStatus.RESOLVED,
      resolvedAt: new Date()
    });

    return this.getTicketById(ticketId);
  }

  public async closeTicket(ticketId: string): Promise<Ticket> {
    const ticket = await Ticket.findByPk(ticketId);
    if (!ticket) throw new BaseError(ERRORS.NOT_FOUND);

    await ticket.update({
      status: TicketStatus.CLOSED,
      resolvedAt: ticket.resolvedAt || new Date()
    });

    return this.getTicketById(ticketId);
  }

  // ─── CSAT ─────────────────────────────────────────────────────────────
  public async submitCSAT(ticketId: string, rating: number, comment?: string): Promise<Ticket> {
    const ticket = await Ticket.findByPk(ticketId);
    if (!ticket) throw new BaseError(ERRORS.NOT_FOUND);

    if (rating < 1 || rating > 5) {
      throw new BaseError(ERRORS.SOMETHING_WENT_WRONG);
    }

    await ticket.update({
      csatRating: rating,
      csatComment: comment || null
    });

    return ticket;
  }

  // ─── Metrics / Dashboard ──────────────────────────────────────────────
  public async getTicketMetrics(): Promise<any> {
    const openCount = await Ticket.count({
      where: { status: { [Op.in]: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.WAITING_CUSTOMER] } }
    });

    // Average resolution time (in hours) for resolved/closed tickets
    const resolvedTickets = await Ticket.findAll({
      where: {
        resolvedAt: { [Op.ne]: null }
      },
      attributes: ['createdAt', 'resolvedAt']
    });

    let avgResolutionTime = 0;
    if (resolvedTickets.length > 0) {
      const totalHours = resolvedTickets.reduce((sum, t) => {
        const created = new Date(t.createdAt).getTime();
        const resolved = new Date(t.resolvedAt!).getTime();
        return sum + (resolved - created) / (1000 * 60 * 60);
      }, 0);
      avgResolutionTime = Math.round((totalHours / resolvedTickets.length) * 10) / 10;
    }

    // SLA compliance: tickets resolved before SLA deadline
    const ticketsWithSLA = await Ticket.findAll({
      where: {
        slaDeadline: { [Op.ne]: null },
        resolvedAt: { [Op.ne]: null }
      },
      attributes: ['slaDeadline', 'resolvedAt']
    });

    let slaComplianceRate = 100;
    if (ticketsWithSLA.length > 0) {
      const compliant = ticketsWithSLA.filter(t => new Date(t.resolvedAt!) <= new Date(t.slaDeadline!)).length;
      slaComplianceRate = Math.round((compliant / ticketsWithSLA.length) * 100 * 10) / 10;
    }

    // Average CSAT
    const ratedTickets = await Ticket.findAll({
      where: { csatRating: { [Op.ne]: null } },
      attributes: ['csatRating']
    });

    let avgCSAT = 0;
    if (ratedTickets.length > 0) {
      const totalRating = ratedTickets.reduce((sum, t) => sum + (t.csatRating || 0), 0);
      avgCSAT = Math.round((totalRating / ratedTickets.length) * 10) / 10;
    }

    // Tickets by priority
    const ticketsByPriority: Record<string, number> = {};
    for (const p of Object.values(TicketPriority)) {
      ticketsByPriority[p] = await Ticket.count({ where: { priority: p } });
    }

    // Tickets by status
    const ticketsByStatus: Record<string, number> = {};
    for (const s of Object.values(TicketStatus)) {
      ticketsByStatus[s] = await Ticket.count({ where: { status: s } });
    }

    // SLA breach data
    const breachedCount = await Ticket.count({
      where: {
        slaDeadline: { [Op.lt]: new Date() },
        resolvedAt: { [Op.eq]: null },
        status: { [Op.notIn]: [TicketStatus.RESOLVED, TicketStatus.CLOSED] }
      }
    });

    // At-risk tickets (within 2 hours of breach)
    const atRiskThreshold = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const atRiskCount = await Ticket.count({
      where: {
        slaDeadline: { [Op.between]: [new Date(), atRiskThreshold] },
        resolvedAt: { [Op.eq]: null },
        status: { [Op.notIn]: [TicketStatus.RESOLVED, TicketStatus.CLOSED] }
      }
    });

    return {
      openCount,
      avgResolutionTime,
      slaComplianceRate,
      avgCSAT,
      ticketsByPriority,
      ticketsByStatus,
      breachedCount,
      atRiskCount
    };
  }

  // ─── Agent Workload ───────────────────────────────────────────────────
  public async getAgentWorkload(): Promise<any[]> {
    const agents = await User.findAll({
      attributes: ['id', 'name', 'email', 'profilePicture']
    });

    const workload = await Promise.all(
      agents.map(async agent => {
        const openTickets = await Ticket.count({
          where: {
            assignedTo: agent.id,
            status: { [Op.in]: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.WAITING_CUSTOMER] }
          }
        });

        const resolvedToday = await Ticket.count({
          where: {
            assignedTo: agent.id,
            status: TicketStatus.RESOLVED,
            resolvedAt: { [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)) }
          }
        });

        // Avg CSAT for this agent
        const agentRatedTickets = await Ticket.findAll({
          where: {
            assignedTo: agent.id,
            csatRating: { [Op.ne]: null }
          },
          attributes: ['csatRating']
        });

        let avgCSAT = 0;
        if (agentRatedTickets.length > 0) {
          const totalRating = agentRatedTickets.reduce((sum, t) => sum + (t.csatRating || 0), 0);
          avgCSAT = Math.round((totalRating / agentRatedTickets.length) * 10) / 10;
        }

        return {
          agent: {
            id: agent.id,
            name: agent.name,
            email: agent.email,
            profilePicture: agent.profilePicture
          },
          openTickets,
          resolvedToday,
          avgCSAT
        };
      })
    );

    return workload.sort((a, b) => b.openTickets - a.openTickets);
  }

  // ─── SLA Breach Check ─────────────────────────────────────────────────
  public async checkSLABreaches(): Promise<Ticket[]> {
    const breachedTickets = await Ticket.findAll({
      where: {
        slaDeadline: { [Op.lt]: new Date() },
        resolvedAt: { [Op.eq]: null },
        status: { [Op.notIn]: [TicketStatus.RESOLVED, TicketStatus.CLOSED] }
      },
      include: [{ model: User, as: 'assignee', attributes: ['id', 'name', 'email'] }]
    });

    return breachedTickets;
  }

  // ─── Canned Responses ─────────────────────────────────────────────────
  public async getCannedResponses(query: any): Promise<CannedResponse[]> {
    const where: any = {};
    if (query.category) where.category = query.category;
    if (query.search) {
      where[Op.or] = [{ title: { [Op.iLike]: `%${query.search}%` } }, { body: { [Op.iLike]: `%${query.search}%` } }];
    }

    return CannedResponse.findAll({ where, order: [['title', 'ASC']] });
  }

  public async createCannedResponse(data: any): Promise<CannedResponse> {
    return CannedResponse.create(data);
  }

  public async updateCannedResponse(id: string, data: any): Promise<CannedResponse> {
    const response = await CannedResponse.findByPk(id);
    if (!response) throw new BaseError(ERRORS.NOT_FOUND);
    await response.update(data);
    return response;
  }

  public async deleteCannedResponse(id: string): Promise<void> {
    const response = await CannedResponse.findByPk(id);
    if (!response) throw new BaseError(ERRORS.NOT_FOUND);
    await response.destroy();
  }

  // ─── Categories ───────────────────────────────────────────────────────
  public async getCategories(): Promise<TicketCategory[]> {
    return TicketCategory.findAll({
      include: [{ model: TicketCategory, as: 'children' }],
      where: { parentId: { [Op.eq]: null } },
      order: [['name', 'ASC']]
    });
  }

  public async createCategory(data: any): Promise<TicketCategory> {
    return TicketCategory.create(data);
  }

  public async updateCategory(id: string, data: any): Promise<TicketCategory> {
    const category = await TicketCategory.findByPk(id);
    if (!category) throw new BaseError(ERRORS.NOT_FOUND);
    await category.update(data);
    return category;
  }

  public async deleteCategory(id: string): Promise<void> {
    const category = await TicketCategory.findByPk(id);
    if (!category) throw new BaseError(ERRORS.NOT_FOUND);
    await category.destroy();
  }

  // ─── SLA Configuration ────────────────────────────────────────────────
  public async getSLAConfigs(): Promise<SLAConfig[]> {
    return SLAConfig.findAll({ order: [['priority', 'ASC']] });
  }

  public async createSLAConfig(data: any): Promise<SLAConfig> {
    return SLAConfig.create(data);
  }

  public async updateSLAConfig(id: string, data: any): Promise<SLAConfig> {
    const config = await SLAConfig.findByPk(id);
    if (!config) throw new BaseError(ERRORS.NOT_FOUND);
    await config.update(data);
    return config;
  }

  public async deleteSLAConfig(id: string): Promise<void> {
    const config = await SLAConfig.findByPk(id);
    if (!config) throw new BaseError(ERRORS.NOT_FOUND);
    await config.destroy();
  }
}

export default new SupportService();
