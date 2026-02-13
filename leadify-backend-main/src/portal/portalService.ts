import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import PortalUser from './portalUserModel';
import SupportTicket from './supportTicketModel';
import Client from '../client/clientModel';
import Deal from '../deal/model/dealModel';
import Invoice from '../deal/model/invoiceMode';
import Contract from '../contract/contractModel';
import { TicketStatus } from './portalEnum';

class PortalService {
  // Auth
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

  // Dashboard
  async getDashboard(clientId: string) {
    const [deals, tickets] = await Promise.all([
      Deal.findAll({ where: { clientId }, attributes: ['id', 'name', 'status', 'createdAt'], order: [['createdAt', 'DESC']], limit: 5 }),
      SupportTicket.findAll({ where: { '$portalUser.clientId$': clientId }, include: [{ model: PortalUser, attributes: [] }], order: [['createdAt', 'DESC']], limit: 5 })
    ]);
    return { deals, tickets };
  }

  // Deals
  async getDeals(clientId: string) {
    return Deal.findAll({
      where: { clientId },
      attributes: ['id', 'name', 'status', 'totalAmount', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });
  }

  // Invoices
  async getInvoices(clientId: string) {
    return Invoice.findAll({
      include: [{ model: Deal, where: { clientId }, attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']]
    });
  }

  // Contracts
  async getContracts(clientId: string) {
    return Contract.findAll({
      include: [{ model: Deal, where: { clientId }, attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']]
    });
  }

  // Support Tickets
  async getTickets(portalUserId: string) {
    return SupportTicket.findAll({
      where: { portalUserId },
      order: [['createdAt', 'DESC']]
    });
  }

  async createTicket(portalUserId: string, data: { subject: string; description: string; priority?: string }) {
    return SupportTicket.create({
      ...data,
      portalUserId,
      status: TicketStatus.OPEN
    });
  }

  async getTicketById(id: string, portalUserId: string) {
    const ticket = await SupportTicket.findOne({ where: { id, portalUserId } });
    if (!ticket) throw new Error('Ticket not found');
    return ticket;
  }

  // Admin: manage portal users
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

  // Admin: manage tickets
  async getAllTickets() {
    return SupportTicket.findAll({
      include: [{ model: PortalUser, attributes: ['id', 'name', 'email'] }],
      order: [['createdAt', 'DESC']]
    });
  }

  async respondToTicket(id: string, response: string, status?: string) {
    const ticket = await SupportTicket.findByPk(id);
    if (!ticket) throw new Error('Ticket not found');
    return ticket.update({
      response,
      respondedAt: new Date(),
      status: status || TicketStatus.RESOLVED
    });
  }
}

export default new PortalService();
