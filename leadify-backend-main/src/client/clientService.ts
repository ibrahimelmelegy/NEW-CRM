import { Includeable, Op, Transaction, WhereOptions } from 'sequelize';
import { clampPagination } from '../utils/pagination';
import { LeadStatusEnums } from '../lead/leadEnum';
import Lead from '../lead/leadModel';
import uploaderService from '../uploader/uploader.service';
import User from '../user/userModel';
import BaseError from '../utils/error/base-http-exception';
import { ERRORS } from '../utils/error/errors';
import { SortByEnum, SortEnum } from './clientEnum';
import Client from './clientModel';
import { CreateClientInput } from './inputs/createClientInput';
import { createActivityLog } from '../activity-logs/activityService';
import leadService from '../lead/leadService';
import { ClientPermissionsEnum } from '../role/roleEnum';
import ClientUsers from './client_UsersModel';
import * as ExcelJS from 'exceljs';
import { sendEmail } from '../utils/emailHelper';
import notificationService from '../notification/notificationService';
import { tenantWhere } from '../utils/tenantScope';
import { io } from '../server';
import { TriggerType } from '../workflow/workflowModel';
import workflowService from '../workflow/workflowService';
import Deal from '../deal/model/dealModel';
import { DealStageEnums } from '../deal/dealEnum';
import Invoice from '../deal/model/invoiceMode';
import CommActivity from '../communication/models/activityModel';
import CompanyNote from './companyNoteModel';
import CallLog from '../communication/models/callLogModel';
import MeetingNote from '../communication/models/meetingNoteModel';

class ClientService {
  async createClient(input: CreateClientInput, admin: User, t?: Transaction): Promise<Client> {
    if (input?.leadId) {
      await leadService.leadOrError({ id: input.leadId });
      await Lead.update(
        {
          status: LeadStatusEnums.CONVERTED
        },
        {
          where: { id: input.leadId },
          ...(t && { transaction: t })
        }
      );
    }

    if (input?.fileUpload?.length) {
      await uploaderService.setFileReferences(input.fileUpload);
    }
    if (input.email) await this.errorIfClientWithExistEmail(input.email);
    if (input.phoneNumber) await this.errorIfClientWithExistPhone(input.phoneNumber);
    const client = await Client.create(
      { ...input },
      {
        ...(t && { transaction: t })
      }
    );
    // Associate users
    if (input.users && Array.isArray(input.users)) {
      await client.$set('users', input.users, { ...(t && { transaction: t }) });
    }

    if (input.users?.length) {
      await Promise.all(
        input.users.map((item: number) => notificationService.sendAssignClientNotification({ userId: item, target: client.id }, client, admin))
      );
    }
    await createActivityLog('client', 'create', client.id, admin.id, null, 'Client created succesfully');

    try { io.emit('client:created', { id: client.id, clientName: client.clientName, companyName: client.companyName }); } catch {}

    // Trigger workflow automation for client creation
    workflowService.processEntityEvent('client', String(client.id), TriggerType.ON_CREATE, null, client.toJSON(), admin.id).catch((err: Error) => {
      console.error('Workflow processEntityEvent (client.create) error:', err.message);
    });

    return client;
  }

  async errorIfClientWithExistEmail(email: string, id?: string): Promise<void> {
    const clientWithEmail = await Client.findOne({ where: { email, ...(id && { id: { [Op.ne]: id } }) } });
    if (clientWithEmail) throw new BaseError(ERRORS.EMAIL_ALREADY_EXISTS);
  }

  async errorIfClientWithExistPhone(phone: string, id?: string): Promise<void> {
    const clientWithPhone = await Client.findOne({ where: { phoneNumber: phone, ...(id && { id: { [Op.ne]: id } }) } });
    if (clientWithPhone) throw new BaseError(ERRORS.PHONE_ALREADY_EXISTS);
  }

  async updateClient(id: string, input: any, user: User): Promise<any> {
    await this.validateClientAccess(id, user);
    const client = await this.clientOrError({ id });

    // Capture old data for workflow field-change detection
    const oldClientData = client.toJSON();

    if (input.email) await this.errorIfClientWithExistEmail(input.email, id);
    if (input.phoneNumber) await this.errorIfClientWithExistPhone(input.phoneNumber, id);
    client.set(input);
    await createActivityLog('client', 'update', client.id, user.id, null, `New updates added suucesfully`);
    if (input.users && Array.isArray(input.users)) await client.$set('users', input.users);
    if (input.users?.length) {
      await Promise.all(
        input.users.map((item: number) => notificationService.sendAssignClientNotification({ userId: item, target: client.id }, client, user))
      );
    }

    const updatedClient = await client.save();
    try { io.emit('client:updated', { id: updatedClient.id, clientName: updatedClient.clientName, companyName: updatedClient.companyName }); } catch {}

    // Trigger workflow automation for client update
    const newClientData = updatedClient.toJSON();
    workflowService.processEntityEvent('client', String(client.id), TriggerType.ON_UPDATE, oldClientData, newClientData, user.id).catch((err: Error) => {
      console.error('Workflow processEntityEvent (client.update) error:', err.message);
    });

    return updatedClient;
  }

  async getClientContacts(clientId: string, user: User): Promise<User[]> {
    await this.validateClientAccess(clientId, user);
    const client = await this.clientOrError({ id: clientId }, [
      {
        model: User,
        as: 'users',
        attributes: ['id', 'name', 'email', 'phone', 'status']
      }
    ]);
    return client.users || [];
  }

  async clientOrError(filter: WhereOptions, joinedTables?: Includeable[]): Promise<Client> {
    const client = await Client.findOne({ where: filter, include: joinedTables || [] });
    if (!client) throw new BaseError(ERRORS.CLIENT_NOT_FOUND);
    return client;
  }

  async getClients(query: any, user: User): Promise<any> {
    const { page, limit, offset } = clampPagination(query);

    if (!user.role.permissions.includes(ClientPermissionsEnum.VIEW_GLOBAL_CLIENTS)) query.userId = user.id;

    const { rows: clients, count: totalItems } = await Client.findAndCountAll({
      attributes: ['id', 'clientName', 'companyName', 'email', 'phoneNumber', 'clientStatus', 'clientType', 'industry', 'createdAt', 'updatedAt'],
      where: {
        ...tenantWhere(user),
        ...(query.searchKey && {
          [Op.or]: [
            { clientName: { [Op.iLike]: `%${query.searchKey}%` } },
            { companyName: { [Op.iLike]: `%${query.searchKey}%` } },
            { email: { [Op.iLike]: `%${query.searchKey}%` } },
            { phoneNumber: { [Op.iLike]: `%${query.searchKey}%` } }
          ]
        }),
        ...(query?.status &&
          query?.status?.length > 0 && {
            clientStatus: {
              [Op.in]: query.status // Matches any value in the array
            }
          }),
        ...(query?.type &&
          query?.type?.length > 0 && {
            clientType: {
              [Op.in]: query.type // Matches any value in the array
            }
          })
      },
      include: [
        {
          model: User,
          as: 'users',
          attributes: ['id', 'name', 'email'],
          through: { attributes: [] }, // Exclude join table attributes
          ...(query.userId && {
            required: true, // <-- THIS is crucial to apply WHERE in count query
            where: { id: query.userId }
          })
        }
      ],
      limit,
      offset,
      distinct: true, // <-- THIS is crucial so count is not duplicated due to joins
      order: [
        [
          query.sortBy && Object.keys(SortByEnum).includes(query.sortBy) ? query.sortBy : 'createdAt',
          query.sort && Object.values(SortEnum).includes(query.sort) ? query.sort : SortEnum.DESC
        ]
      ]
    });

    return {
      docs: clients,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit)
      }
    };
  }

  async clientById(id: string, user: User): Promise<any> {
    await this.validateClientAccess(id, user);
    const client = await this.clientOrError({ id }, [
      {
        model: User,
        as: 'users',
        attributes: ['id', 'name', 'email'],
        through: { attributes: [] }
      }
    ]);
    return client;
  }

  async getClientsArray(): Promise<any> {
    const clients = await Client.findAll({
      attributes: ['id', 'clientName', 'companyName']
    });
    return clients;
  }

  public async deleteClient(id: string, user: User): Promise<void> {
    await this.validateClientAccess(id, user);
    const client = await this.clientOrError({ id });
    await createActivityLog('client', 'delete', client.id, user.id, null, 'Client deleted');
    await client.destroy();
  }

  public async validateClientAccess(clientId: string, user: User): Promise<void> {
    if (user.role.permissions.includes(ClientPermissionsEnum.VIEW_GLOBAL_CLIENTS)) return;

    const isAssigned = await this.isUserAssignedToClient(clientId, user.id);
    if (!isAssigned) throw new BaseError(ERRORS.ACCESS_DENIED);
  }

  private async isUserAssignedToClient(clientId: string, userId: number): Promise<boolean> {
    const assignment = await ClientUsers.findOne({ where: { clientId, userId } });
    return !!assignment; // Returns true if assigned, false otherwise
  }

  // ─── Enterprise: Client Health Score ───────────────────────────────────────
  async calculateHealthScore(clientId: string): Promise<{
    score: number;
    factors: Array<{ name: string; points: number; met: boolean }>;
  }> {
    const client = await this.clientOrError({ id: clientId }, [
      {
        model: User,
        as: 'users',
        attributes: ['id'],
        through: { attributes: [] }
      }
    ]);

    const factors: Array<{ name: string; points: number; met: boolean }> = [];
    let score = 0;

    // Factor 1: Has active deals? +20
    const activeDeals = await Deal.count({
      where: {
        clientId,
        stage: { [Op.notIn]: [DealStageEnums.CLOSED, DealStageEnums.CANCELLED, DealStageEnums.ARCHIVED, DealStageEnums.CONVERTED] }
      }
    });
    const hasActiveDeals = activeDeals > 0;
    factors.push({ name: 'Has active deals', points: 20, met: hasActiveDeals });
    if (hasActiveDeals) score += 20;

    // Factor 2: Has recent activity (last 30 days)? +25
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentActivityCount = await CommActivity.count({
      where: {
        contactId: clientId,
        contactType: 'CLIENT',
        createdAt: { [Op.gte]: thirtyDaysAgo }
      }
    });
    const hasRecentActivity = recentActivityCount > 0;
    factors.push({ name: 'Recent activity (last 30 days)', points: 25, met: hasRecentActivity });
    if (hasRecentActivity) score += 25;

    // Factor 3: Has paid invoices? +20
    const paidInvoices = await Invoice.count({
      where: {
        collected: true
      },
      include: [
        {
          model: Deal,
          as: 'deal',
          attributes: [],
          where: { clientId },
          required: true
        }
      ]
    });
    const hasPaidInvoices = paidInvoices > 0;
    factors.push({ name: 'Has paid invoices', points: 20, met: hasPaidInvoices });
    if (hasPaidInvoices) score += 20;

    // Factor 4: Number of touchpoints (emails, calls, meetings) in last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const touchpoints = await CommActivity.count({
      where: {
        contactId: clientId,
        contactType: 'CLIENT',
        type: { [Op.in]: ['EMAIL', 'CALL', 'MEETING'] },
        createdAt: { [Op.gte]: ninetyDaysAgo }
      }
    });
    let touchpointPoints = 0;
    if (touchpoints >= 5) touchpointPoints = 20;
    else if (touchpoints >= 3) touchpointPoints = 10;
    else if (touchpoints >= 1) touchpointPoints = 5;
    factors.push({ name: `Touchpoints in 90 days (${touchpoints})`, points: touchpointPoints, met: touchpoints > 0 });
    score += touchpointPoints;

    // Factor 5: Has assigned users? +15
    const hasUsers = client.users && client.users.length > 0;
    factors.push({ name: 'Has assigned users', points: 15, met: !!hasUsers });
    if (hasUsers) score += 15;

    return { score, factors };
  }

  // ─── Enterprise: Client Segmentation ─────────────────────────────────────
  async segmentClients(tenantId?: string): Promise<{
    segments: Record<string, { count: number; clients: Array<{ id: string; clientName: string; score: number }> }>;
    totalClients: number;
  }> {
    const where: Record<string, any> = tenantId ? { tenantId } : {};
    const clients = await Client.findAll({
      where,
      attributes: ['id', 'clientName']
    });

    const segments: Record<string, { count: number; clients: Array<{ id: string; clientName: string; score: number }> }> = {
      ENTERPRISE: { count: 0, clients: [] },
      GROWING: { count: 0, clients: [] },
      AT_RISK: { count: 0, clients: [] },
      CHURNING: { count: 0, clients: [] }
    };

    for (const client of clients) {
      const { score } = await this.calculateHealthScore(client.id);
      const entry = { id: client.id, clientName: client.clientName, score };

      if (score >= 80) {
        segments.ENTERPRISE.count++;
        segments.ENTERPRISE.clients.push(entry);
      } else if (score >= 60) {
        segments.GROWING.count++;
        segments.GROWING.clients.push(entry);
      } else if (score >= 40) {
        segments.AT_RISK.count++;
        segments.AT_RISK.clients.push(entry);
      } else {
        segments.CHURNING.count++;
        segments.CHURNING.clients.push(entry);
      }
    }

    return { segments, totalClients: clients.length };
  }

  // ─── Enterprise: Client Analytics ────────────────────────────────────────
  async getClientAnalytics(tenantId?: string): Promise<{
    totalClients: number;
    newThisMonth: number;
    avgHealthScore: number;
    segmentDistribution: Record<string, number>;
    topByDealValue: Array<{ id: string; clientName: string; totalDealValue: number }>;
  }> {
    const where: Record<string, any> = tenantId ? { tenantId } : {};

    // Total clients
    const totalClients = await Client.count({ where });

    // New this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const newThisMonth = await Client.count({
      where: {
        ...where,
        createdAt: { [Op.gte]: startOfMonth }
      }
    });

    // Calculate health scores for all clients
    const allClients = await Client.findAll({
      where,
      attributes: ['id', 'clientName']
    });

    let totalScore = 0;
    const segmentDistribution: Record<string, number> = {
      ENTERPRISE: 0,
      GROWING: 0,
      AT_RISK: 0,
      CHURNING: 0
    };

    for (const client of allClients) {
      const { score } = await this.calculateHealthScore(client.id);
      totalScore += score;

      if (score >= 80) segmentDistribution.ENTERPRISE++;
      else if (score >= 60) segmentDistribution.GROWING++;
      else if (score >= 40) segmentDistribution.AT_RISK++;
      else segmentDistribution.CHURNING++;
    }

    const avgHealthScore = allClients.length > 0 ? Math.round((totalScore / allClients.length) * 100) / 100 : 0;

    // Top 10 clients by deal value -- query from Deal side since Client lacks HasMany Deal
    const dealsByClient = await Deal.findAll({
      where: {
        stage: { [Op.ne]: DealStageEnums.CONVERTED },
        clientId: { [Op.ne]: null }
      },
      attributes: ['clientId', 'price'],
      raw: true
    });

    const clientDealMap: Record<string, number> = {};
    for (const d of dealsByClient) {
      if (d.clientId) {
        clientDealMap[d.clientId] = (clientDealMap[d.clientId] || 0) + (Number(d.price) || 0);
      }
    }

    const topClientIds = Object.entries(clientDealMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([id]) => id);

    const topClientsData = topClientIds.length > 0
      ? await Client.findAll({
          where: { id: { [Op.in]: topClientIds } },
          attributes: ['id', 'clientName']
        })
      : [];

    const topByDealValue = topClientIds.map(id => {
      const c = topClientsData.find(cl => cl.id === id);
      return {
        id,
        clientName: c?.clientName || 'Unknown',
        totalDealValue: clientDealMap[id] || 0
      };
    });

    return {
      totalClients,
      newThisMonth,
      avgHealthScore,
      segmentDistribution,
      topByDealValue
    };
  }

  public async sendClientsExcelByEmail(query: any, user: User, email: string): Promise<void> {
    const where: Record<string, any> = {
      ...(query.searchKey && {
        [Op.or]: [
          { clientName: { [Op.iLike]: `%${query.searchKey}%` } },
          { companyName: { [Op.iLike]: `%${query.searchKey}%` } },
          { email: { [Op.iLike]: `%${query.searchKey}%` } },
          { phoneNumber: { [Op.iLike]: `%${query.searchKey}%` } }
        ]
      }),
      ...(query.status?.length && {
        clientStatus: { [Op.in]: query.status }
      }),
      ...(query.type?.length && {
        clientType: { [Op.in]: query.type }
      })
    };

    if (!user.role.permissions.includes(ClientPermissionsEnum.VIEW_GLOBAL_CLIENTS)) {
      where['$users.id$'] = user.id;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Clients');

    worksheet.columns = [
      { header: 'Client Name', key: 'clientName', width: 30 },
      { header: 'Company Name', key: 'companyName', width: 30 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Phone Number', key: 'phoneNumber', width: 20 },
      { header: 'Status', key: 'clientStatus', width: 15 },
      { header: 'Type', key: 'clientType', width: 15 },
      { header: 'Created At', key: 'createdAt', width: 25 }
    ];

    const batchSize = 1000;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const clients = await Client.findAll({
        where,
        include: [
          {
            model: User,
            as: 'users',
            attributes: ['id', 'name'],
            through: { attributes: [] }, // Exclude join table attributes
            required: query.userId ? true : false, // Ensure filtering only when assignedUserId exists
            where: query.userId ? { id: query.userId } : undefined
          }
        ],
        limit: batchSize,
        offset
      });

      for (const client of clients) {
        worksheet.addRow({
          clientName: client.clientName,
          companyName: client.companyName,
          email: client.email,
          phoneNumber: client.phoneNumber,
          clientStatus: client.clientStatus,
          clientType: client.clientType,
          createdAt: client.createdAt
        });
      }

      hasMore = clients.length === batchSize;
      offset += batchSize;
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const attachment = Buffer.from(buffer).toString('base64');
    await sendEmail({
      to: email,
      subject: 'Clients Export',
      text: 'Please find attached the Excel file containing the filtered clients.',
      attachment: {
        name: 'clients.xlsx',
        content: attachment
      }
    });
  }

  // ─── Company Hierarchy ───────────────────────────────────────────────────
  async getCompanyHierarchy(companyId: string): Promise<any> {
    const company = await this.clientOrError({ id: companyId });

    // Get all subsidiaries (recursive)
    const subsidiaries = await this.getSubsidiariesRecursive(companyId);

    // Get parent chain
    const parentChain = await this.getParentChain(companyId);

    return {
      company: {
        id: company.id,
        name: company.clientName,
        companyName: company.companyName,
        parentCompanyId: company.parentCompanyId
      },
      subsidiaries,
      parentChain
    };
  }

  private async getSubsidiariesRecursive(parentId: string): Promise<any[]> {
    const children = await Client.findAll({
      where: { parentCompanyId: parentId },
      attributes: ['id', 'clientName', 'companyName', 'parentCompanyId', 'industry']
    });

    const result = [];
    for (const child of children) {
      const grandChildren = await this.getSubsidiariesRecursive(child.id);
      result.push({
        id: child.id,
        name: child.clientName,
        companyName: child.companyName,
        industry: child.industry,
        children: grandChildren
      });
    }
    return result;
  }

  private async getParentChain(companyId: string): Promise<any[]> {
    const chain = [];
    let currentId: string | undefined = companyId;

    while (currentId) {
      const company: any = await Client.findOne({
        where: { id: currentId },
        attributes: ['id', 'clientName', 'companyName', 'parentCompanyId']
      });

      if (!company || company.id === companyId) {
        currentId = company?.parentCompanyId;
        continue;
      }

      chain.unshift({
        id: company.id,
        name: company.clientName,
        companyName: company.companyName
      });

      currentId = company.parentCompanyId;
    }

    return chain;
  }

  // ─── Company Timeline ────────────────────────────────────────────────────
  async getCompanyTimeline(companyId: string, limit = 50): Promise<any[]> {
    await this.clientOrError({ id: companyId });

    // Fetch deals
    const deals = await Deal.findAll({
      where: { clientId: companyId },
      attributes: ['id', 'name', 'stage', 'price', 'createdAt', 'updatedAt'],
      limit: 20,
      order: [['createdAt', 'DESC']]
    });

    // Fetch communication activities
    const activities = await CommActivity.findAll({
      where: { contactId: companyId, contactType: 'CLIENT' },
      attributes: ['id', 'type', 'subject', 'description', 'createdAt'],
      limit: 30,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name']
        }
      ]
    });

    // Fetch call logs
    const calls = await CallLog.findAll({
      where: { contactId: companyId, contactType: 'CLIENT' },
      attributes: ['id', 'direction', 'duration', 'status', 'notes', 'createdAt'],
      limit: 20,
      order: [['createdAt', 'DESC']]
    });

    // Fetch meeting notes
    const meetings = await MeetingNote.findAll({
      where: { relatedToId: companyId, relatedToType: 'CLIENT' },
      attributes: ['id', 'title', 'notes', 'meetingDate', 'createdAt'],
      limit: 20,
      order: [['createdAt', 'DESC']]
    });

    // Combine and sort all timeline items
    const timeline = [
      ...deals.map((d) => ({
        id: d.id,
        type: 'DEAL',
        title: d.name,
        description: `Deal ${d.stage} - $${d.price}`,
        timestamp: d.createdAt,
        data: d.toJSON()
      })),
      ...activities.map((a) => ({
        id: a.id,
        type: 'ACTIVITY',
        title: a.subject || a.type,
        description: a.description,
        timestamp: a.createdAt,
        user: a.user,
        data: a.toJSON()
      })),
      ...calls.map((c) => ({
        id: c.id,
        type: 'CALL',
        title: `${c.direction} Call`,
        description: c.notes || `${c.status} - ${c.duration}s`,
        timestamp: c.createdAt,
        data: c.toJSON()
      })),
      ...meetings.map((m) => ({
        id: m.id,
        type: 'MEETING',
        title: m.title,
        description: m.notes,
        timestamp: m.meetingDate || m.createdAt,
        data: m.toJSON()
      }))
    ];

    return timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, limit);
  }

  // ─── Company Revenue Analytics ───────────────────────────────────────────
  async getCompanyRevenue(companyId: string): Promise<{
    totalRevenue: number;
    wonDeals: number;
    avgDealSize: number;
    lifetimeValue: number;
    revenueByMonth: Array<{ month: string; revenue: number }>;
  }> {
    await this.clientOrError({ id: companyId });

    const wonDeals = await Deal.findAll({
      where: {
        clientId: companyId,
        stage: DealStageEnums.CLOSED
      },
      attributes: ['price', 'createdAt']
    });

    const totalRevenue = wonDeals.reduce((sum, deal) => sum + (Number(deal.price) || 0), 0);
    const avgDealSize = wonDeals.length > 0 ? totalRevenue / wonDeals.length : 0;

    // Group by month
    const revenueByMonth: Record<string, number> = {};
    wonDeals.forEach(deal => {
      const month = new Date(deal.createdAt).toISOString().substring(0, 7); // YYYY-MM
      revenueByMonth[month] = (revenueByMonth[month] || 0) + (Number(deal.price) || 0);
    });

    const revenueByMonthArray = Object.entries(revenueByMonth)
      .map(([month, revenue]) => ({ month, revenue }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      totalRevenue,
      wonDeals: wonDeals.length,
      avgDealSize,
      lifetimeValue: totalRevenue, // Can be enhanced with recurring revenue calculations
      revenueByMonth: revenueByMonthArray
    };
  }

  // ─── Company Notes ───────────────────────────────────────────────────────
  async createCompanyNote(companyId: string, content: string, userId: number, attachments?: string[]): Promise<CompanyNote> {
    await this.clientOrError({ id: companyId });

    const note = await CompanyNote.create({
      companyId,
      userId,
      content,
      attachments: attachments || []
    });

    return note;
  }

  async getCompanyNotes(companyId: string): Promise<CompanyNote[]> {
    await this.clientOrError({ id: companyId });

    const notes = await CompanyNote.findAll({
      where: { companyId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [
        ['isPinned', 'DESC'],
        ['createdAt', 'DESC']
      ]
    });

    return notes;
  }

  async updateCompanyNote(noteId: string, updates: Partial<CompanyNote>): Promise<CompanyNote> {
    const note = await CompanyNote.findByPk(noteId);
    if (!note) throw new BaseError(ERRORS.NOT_FOUND);

    await note.update(updates);
    return note;
  }

  async deleteCompanyNote(noteId: string): Promise<void> {
    const note = await CompanyNote.findByPk(noteId);
    if (!note) throw new BaseError(ERRORS.NOT_FOUND);

    await note.destroy();
  }

  // ─── Bulk Operations ─────────────────────────────────────────────────────
  async bulkUpdateCompanies(companyIds: string[], updates: any, user: User): Promise<number> {
    const updateCount = await Client.update(updates, {
      where: {
        id: { [Op.in]: companyIds },
        ...tenantWhere(user)
      }
    });

    return updateCount[0];
  }

  async mergeCompanies(sourceId: string, targetId: string, user: User): Promise<Client> {
    const [source, target] = await Promise.all([
      this.clientOrError({ id: sourceId }),
      this.clientOrError({ id: targetId })
    ]);

    // Merge logic: move all deals, notes, activities to target
    await Deal.update({ clientId: targetId }, { where: { clientId: sourceId } });
    await CommActivity.update({ contactId: targetId }, { where: { contactId: sourceId, contactType: 'CLIENT' } });
    await CompanyNote.update({ companyId: targetId }, { where: { companyId: sourceId } });

    // Merge custom fields (prefer target, but add missing from source)
    const mergedCustomFields = {
      ...source.customFields,
      ...target.customFields
    };
    target.customFields = mergedCustomFields;

    // Merge users
    const sourceUsers = await source.$get('users');
    if (sourceUsers) {
      await target.$add('users', sourceUsers);
    }

    await target.save();

    // Delete source company
    await source.destroy();

    await createActivityLog('client', 'update', targetId, user.id, null, `Merged company ${source.clientName} into ${target.clientName}`);

    return target;
  }
}

export default new ClientService();
