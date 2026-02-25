import { Op } from 'sequelize';
import Ticket, { TicketStatus, TicketPriority } from './models/ticketModel';
import TicketMessage from './models/ticketMessageModel';
import TicketCategory from './models/ticketCategoryModel';
import CannedResponse from './models/cannedResponseModel';
import User from '../user/userModel';
import Client from '../client/clientModel';
import { IPaginationRes } from '../types';
import BaseError from '../utils/error/base-http-exception';
import { ERRORS } from '../utils/error/errors';

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

  // ─── Tickets ──────────────────────────────────────────────────────────
  public async createTicket(data: any): Promise<Ticket> {
    const ticketNumber = await this.generateTicketNumber();
    const ticket = await Ticket.create({
      ...data,
      ticketNumber,
      status: data.status || TicketStatus.OPEN,
      priority: data.priority || TicketPriority.MEDIUM
    });
    return ticket;
  }

  public async getTickets(query: any): Promise<IPaginationRes<Ticket>> {
    const { page = 1, limit = 20, status, priority, assignedTo, categoryId, search, clientId } = query;

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

    const offset = (Number(page) - 1) * Number(limit);
    const { rows, count } = await Ticket.findAndCountAll({
      where,
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email', 'profilePicture'] },
        { model: Client, as: 'client', attributes: ['id', 'clientName', 'email'] },
        { model: TicketCategory, as: 'category', attributes: ['id', 'name'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset
    });

    return {
      docs: rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalItems: count,
        totalPages: Math.ceil(count / Number(limit))
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

    const updateData: any = { assignedTo: userId };

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

    return {
      openCount,
      avgResolutionTime,
      slaComplianceRate,
      avgCSAT,
      ticketsByPriority,
      ticketsByStatus
    };
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
}

export default new SupportService();
