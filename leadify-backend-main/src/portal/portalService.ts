import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import PortalUser from './portalUserModel';
import SupportTicket from './supportTicketModel';
import TicketMessage from './ticketMessageModel';
import PortalToken from './portalTokenModel';
import Client from '../client/clientModel';
import Deal from '../deal/model/dealModel';
import Invoice from '../deal/model/invoiceMode';
import Contract from '../contract/contractModel';
import Project from '../project/models/projectModel';
import { TicketStatus } from './portalEnum';
import { Op } from 'sequelize';

class PortalService {
  // ─── Auth ──────────────────────────────────────────────────────────────────
  async register(data: { email: string; password: string; name: string; clientId: string }) {
    const existing = await PortalUser.findOne({ where: { email: data.email } });
    if (existing) throw new Error('Email already registered');

    const client = await Client.findByPk(data.clientId);
    if (!client) throw new Error('Client not found');

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await PortalUser.create({
      email: data.email,
      passwordHash,
      name: data.name,
      clientId: data.clientId
    });
    return user;
  }

  async login(email: string, password: string) {
    const user = await PortalUser.findOne({ where: { email }, include: [{ model: Client }] });
    if (!user) throw new Error('Invalid credentials');
    if (!user.isActive) throw new Error('Account disabled');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new Error('Invalid credentials');

    await user.update({ lastLoginAt: new Date() });

    const SECRET_KEY = process.env.SECRET_KEY!;
    const token = jwt.sign({ id: user.id, type: 'portal' }, SECRET_KEY, { expiresIn: '7d' });
    return { token, user };
  }

  // ─── Token-based Portal Access (Magic Link) ───────────────────────────────

  /**
   * Generate a magic-link access token for a client by email.
   * Finds the Client by matching email and creates a PortalToken.
   */
  async generatePortalAccess(clientId: string, email: string) {
    const client = await Client.findByPk(clientId);
    if (!client) throw new Error('Client not found');

    // Deactivate any existing tokens for this client + email
    await PortalToken.update({ isActive: false }, { where: { clientId, email } });

    const token = crypto.randomUUID() + '-' + crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const portalToken = await PortalToken.create({
      clientId,
      email,
      token,
      isActive: true,
      expiresAt
    });

    // In production, send email with the portal link.
    // For now, return the token directly (mock email).
    const portalLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/portal/login?token=${token}`;

    return {
      message: 'Portal access link generated',
      portalLink,
      token: portalToken.token,
      expiresAt: portalToken.expiresAt
    };
  }

  /**
   * Request portal access by email - find the client associated with the email
   */
  async requestPortalAccess(email: string) {
    // Find a client whose email matches the request
    const client = await Client.findOne({ where: { email } });
    if (!client) {
      // Also check portal users
      const portalUser = await PortalUser.findOne({ where: { email }, include: [{ model: Client }] });
      if (portalUser && portalUser.clientId) {
        const result = await this.generatePortalAccess(portalUser.clientId, email);
        return result;
      }
      throw new Error('No account found with this email');
    }

    const result = await this.generatePortalAccess(client.id, email);
    return result;
  }

  /**
   * Validate a portal token and return client data
   */
  async validatePortalToken(token: string) {
    const portalToken = await PortalToken.findOne({
      where: { token, isActive: true },
      include: [{ model: Client }]
    });

    if (!portalToken) throw new Error('Invalid or expired access token');

    if (portalToken.expiresAt && new Date(portalToken.expiresAt) < new Date()) {
      await portalToken.update({ isActive: false });
      throw new Error('Access token has expired');
    }

    await portalToken.update({ lastAccessAt: new Date() });

    return {
      clientId: portalToken.clientId,
      email: portalToken.email,
      client: portalToken.client,
      token: portalToken.token
    };
  }

  // ─── Dashboard ─────────────────────────────────────────────────────────────
  async getDashboard(clientId: string) {
    const [deals, tickets] = await Promise.all([
      Deal.findAll({ where: { clientId }, attributes: ['id', 'name', 'status', 'createdAt'], order: [['createdAt', 'DESC']], limit: 5 }),
      SupportTicket.findAll({
        where: { '$portalUser.clientId$': clientId },
        include: [{ model: PortalUser, attributes: [] }],
        order: [['createdAt', 'DESC']],
        limit: 5
      })
    ]);
    return { deals, tickets };
  }

  /**
   * Client dashboard summary stats: invoice count/total, open tickets, active projects
   */
  async getClientDashboard(clientId: string) {
    const [invoices, openTickets, activeProjects, totalDeals] = await Promise.all([
      // Outstanding (unpaid) invoices
      Invoice.findAll({
        include: [{ model: Deal, where: { clientId }, attributes: [] }],
        where: { collected: { [Op.not]: true } }
      }),
      // Open tickets count
      SupportTicket.count({
        where: {
          status: { [Op.in]: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS] }
        },
        include: [{ model: PortalUser, where: { clientId }, attributes: [] }]
      }),
      // Active projects count
      Project.count({
        where: { clientId, status: { [Op.in]: ['ACTIVE', 'ON_HOLD'] } }
      }),
      // Total deals
      Deal.count({ where: { clientId } })
    ]);

    const outstandingTotal = invoices.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);

    return {
      outstandingInvoices: {
        count: invoices.length,
        total: outstandingTotal
      },
      openTickets,
      activeProjects,
      totalDeals
    };
  }

  // ─── Deals ─────────────────────────────────────────────────────────────────
  async getDeals(clientId: string) {
    return Deal.findAll({
      where: { clientId },
      attributes: ['id', 'name', 'status', 'totalAmount', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });
  }

  // ─── Invoices ──────────────────────────────────────────────────────────────
  async getInvoices(clientId: string) {
    return Invoice.findAll({
      include: [{ model: Deal, where: { clientId }, attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']]
    });
  }

  /**
   * Get client invoices with full details for the portal
   */
  async getClientInvoices(clientId: string) {
    const invoices = await Invoice.findAll({
      include: [{ model: Deal, where: { clientId }, attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']]
    });

    const now = new Date();
    return invoices.map(inv => {
      let status: string;
      if (inv.collected) {
        status = 'PAID';
      } else if (inv.dueDate && new Date(inv.dueDate) < now) {
        status = 'OVERDUE';
      } else {
        status = 'UNPAID';
      }

      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        amount: Number(inv.amount),
        invoiceDate: inv.invoiceDate,
        dueDate: inv.dueDate,
        collected: inv.collected,
        collectedDate: inv.collectedDate,
        status,
        deal: (inv as unknown as Record<string, unknown>).deal || null
      };
    });
  }

  /**
   * Get a single invoice detail for PDF generation
   */
  async getInvoiceForPdf(invoiceId: number, clientId: string) {
    const invoice = await Invoice.findByPk(invoiceId, {
      include: [
        {
          model: Deal,
          where: { clientId },
          attributes: ['id', 'name', 'clientId'],
          include: [{ model: Client, attributes: ['id', 'clientName', 'email', 'phone'] }]
        }
      ]
    });

    if (!invoice) throw new Error('Invoice not found or access denied');
    return invoice;
  }

  // ─── Contracts ─────────────────────────────────────────────────────────────
  async getContracts(clientId: string) {
    return Contract.findAll({
      include: [{ model: Deal, where: { clientId }, attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']]
    });
  }

  // ─── Support Tickets ──────────────────────────────────────────────────────
  async getTickets(portalUserId: string) {
    return SupportTicket.findAll({
      where: { portalUserId },
      order: [['createdAt', 'DESC']]
    });
  }

  /**
   * Get tickets for a client (across all portal users of this client)
   */
  async getClientTickets(clientId: string) {
    return SupportTicket.findAll({
      include: [{ model: PortalUser, where: { clientId }, attributes: ['id', 'name', 'email'] }],
      order: [['createdAt', 'DESC']]
    });
  }

  async createTicket(portalUserId: string, data: { subject: string; description: string; priority?: string }) {
    const ticket = await SupportTicket.create({
      ...data,
      portalUserId,
      status: TicketStatus.OPEN
    });

    // Create initial message from the ticket description
    await TicketMessage.create({
      ticketId: ticket.id,
      message: data.description,
      senderType: 'client',
      portalUserId
    });

    return ticket;
  }

  /**
   * Create a ticket from portal token-based access (no portal user, just clientId)
   */
  async createTicketFromPortal(clientId: string, data: { subject: string; description: string; priority?: string }) {
    // Find the primary portal user for this client
    const portalUser = await PortalUser.findOne({ where: { clientId, isActive: true } });
    if (!portalUser) throw new Error('No portal user found for this client');

    return this.createTicket(portalUser.id, data);
  }

  async getTicketById(id: string, portalUserId: string) {
    const ticket = await SupportTicket.findOne({ where: { id, portalUserId } });
    if (!ticket) throw new Error('Ticket not found');
    return ticket;
  }

  /**
   * Get ticket with all messages (thread)
   */
  async getTicketWithMessages(ticketId: string, portalUserId: string) {
    const ticket = await SupportTicket.findOne({
      where: { id: ticketId, portalUserId }
    });

    if (!ticket) throw new Error('Ticket not found');

    const messages = await TicketMessage.findAll({
      where: { ticketId },
      include: [{ model: PortalUser, attributes: ['id', 'name', 'email'] }],
      order: [['createdAt', 'ASC']]
    });

    return {
      ...ticket.toJSON(),
      messages: messages.map(m => m.toJSON())
    };
  }

  /**
   * Add a message to a ticket (from portal user)
   */
  async addTicketMessageFromPortal(portalUserId: string, ticketId: string, messageText: string) {
    const ticket = await SupportTicket.findOne({
      where: { id: ticketId, portalUserId }
    });

    if (!ticket) throw new Error('Ticket not found');

    // Reopen ticket if it was resolved/closed
    if (ticket.status === TicketStatus.RESOLVED || ticket.status === TicketStatus.CLOSED) {
      await ticket.update({ status: TicketStatus.OPEN });
    }

    const message = await TicketMessage.create({
      ticketId,
      message: messageText,
      senderType: 'client',
      portalUserId
    });

    return message;
  }

  // ─── Projects ──────────────────────────────────────────────────────────────
  async getClientProjects(clientId: string) {
    return Project.findAll({
      where: { clientId },
      attributes: [
        'id',
        'name',
        'status',
        'description',
        'category',
        'startDate',
        'endDate',
        'isCompleted',
        'duration',
        'totalCost',
        'grandTotal',
        'createdAt'
      ],
      order: [['createdAt', 'DESC']]
    });
  }

  // ─── Admin: manage portal users ────────────────────────────────────────────
  async createPortalUser(data: { email: string; password: string; name: string; clientId: string }) {
    return this.register(data);
  }

  async getPortalUsers() {
    return PortalUser.findAll({ include: [{ model: Client, attributes: ['id', 'clientName'] }], order: [['createdAt', 'DESC']] });
  }

  async togglePortalUser(id: string, isActive: boolean) {
    const user = await PortalUser.findByPk(id);
    if (!user) throw new Error('Portal user not found');
    return user.update({ isActive });
  }

  // ─── Admin: manage tickets ─────────────────────────────────────────────────
  async getAllTickets() {
    return SupportTicket.findAll({
      include: [{ model: PortalUser, attributes: ['id', 'name', 'email'] }],
      order: [['createdAt', 'DESC']]
    });
  }

  async respondToTicket(id: string, response: string, status?: string) {
    const ticket = await SupportTicket.findByPk(id);
    if (!ticket) throw new Error('Ticket not found');

    // Add a staff message
    await TicketMessage.create({
      ticketId: id,
      message: response,
      senderType: 'staff'
    });

    return ticket.update({
      response,
      respondedAt: new Date(),
      status: status || TicketStatus.RESOLVED
    });
  }
}

export default new PortalService();
