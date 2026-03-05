import { Includeable, Op, Transaction, WhereOptions } from 'sequelize';
import notificationService from '../notification/notificationService';
import User from '../user/userModel';
import BaseError from '../utils/error/base-http-exception';
import { ERRORS } from '../utils/error/errors';
import { LeadStatusEnums, SortByEnum, SortEnum } from './leadEnum';
import Lead from './leadModel';
import { createActivityLog } from '../activity-logs/activityService';
import xlsx from 'xlsx';
import { LeadPermissionsEnum } from '../role/roleEnum';
import LeadUsers from './model/lead_UsersModel';
import * as ExcelJS from 'exceljs';
import { sendEmail } from '../utils/emailHelper';
import { io } from '../server';
import { tenantWhere, tenantCreate } from '../utils/tenantScope';
import { clampPagination } from '../utils/pagination';

// ---------------------------------------------------------------------------
// Configurable Lead Scoring Rules Engine
// ---------------------------------------------------------------------------

export interface ScoringRule {
  field: string;
  condition: 'exists' | 'equals' | 'contains' | 'greater_than';
  value?: unknown;
  points: number;
  /** Optional group key. When multiple rules share a group, only the highest-
   *  scoring match within that group is counted (e.g. source quality tiers). */
  group?: string;
}

export const DEFAULT_SCORING_RULES: ScoringRule[] = [
  // Contact completeness (max 30)
  { field: 'email', condition: 'exists', points: 10 },
  { field: 'phone', condition: 'exists', points: 10 },
  { field: 'company', condition: 'exists', points: 10 },
  // Source quality (max 25) -- only the best match counts
  { field: 'source', condition: 'equals', value: 'REFERRAL', points: 25, group: 'source_quality' },
  { field: 'source', condition: 'equals', value: 'WEBSITE', points: 20, group: 'source_quality' },
  { field: 'source', condition: 'equals', value: 'LINKEDIN', points: 15, group: 'source_quality' },
  { field: 'source', condition: 'equals', value: 'COLD_CALL', points: 5, group: 'source_quality' },
  // Engagement (max 25)
  { field: 'notes', condition: 'exists', points: 10 },
  { field: 'assignedUsers', condition: 'exists', points: 5 },
  // Budget / value indicators (max 20) -- only the best match counts
  { field: 'budget', condition: 'greater_than', value: 50000, points: 20, group: 'budget_tier' },
  { field: 'budget', condition: 'greater_than', value: 10000, points: 10, group: 'budget_tier' },
  { field: 'budget', condition: 'exists', points: 5, group: 'budget_tier' },
];

/**
 * Evaluate a single rule condition against a lead data object.
 * Returns true when the rule's condition is satisfied.
 */
function evaluateCondition(lead: unknown, rule: ScoringRule): boolean {
  const fieldValue = lead[rule.field];

  switch (rule.condition) {
    case 'exists':
      if (Array.isArray(fieldValue)) return fieldValue.length > 0;
      return !!fieldValue;
    case 'equals':
      return fieldValue === rule.value;
    case 'contains':
      if (typeof fieldValue === 'string') return fieldValue.includes(rule.value);
      if (Array.isArray(fieldValue)) return fieldValue.includes(rule.value);
      return false;
    case 'greater_than':
      return typeof fieldValue === 'number' && fieldValue > rule.value;
    default:
      return false;
  }
}

/**
 * Score a lead against a set of rules.
 *
 * Rules that share a `group` key are treated as mutually-exclusive tiers --
 * only the highest-scoring match within each group contributes to the total.
 * Ungrouped rules are additive.
 *
 * The final score is capped at 100.
 */
export function evaluateScore(lead: unknown, rules: ScoringRule[] = DEFAULT_SCORING_RULES): number {
  let total = 0;

  // Collect the best score per group
  const groupBest: Record<string, number> = {};

  for (const rule of rules) {
    if (!evaluateCondition(lead, rule)) continue;

    if (rule.group) {
      // For grouped rules, keep only the highest match
      groupBest[rule.group] = Math.max(groupBest[rule.group] ?? 0, rule.points);
    } else {
      total += rule.points;
    }
  }

  // Add group winners
  for (const pts of Object.values(groupBest)) {
    total += pts;
  }

  return Math.min(total, 100);
}

class LeadService {
  async createLead(input: unknown, adminId: number, t?: Transaction): Promise<Lead> {
    const { users: inputUsers, ...leadData } = input;

    if (input.email) await this.errorIfLeadWithExistEmail(input.email);
    if (input.phone) await this.errorIfLeadWithExistPhone(input.phone);

    // 🧠 AI Scoring
    leadData.score = this.calculateScore(leadData);

    let users = inputUsers;
    if (!users || !Array.isArray(users)) {
      users = [adminId];
    } else if (!users.includes(adminId)) {
      users.push(adminId);
    }

    const foundUsers = await User.findAll({
      where: { id: { [Op.in]: users } }
    });
    if (!foundUsers.length) throw new BaseError(ERRORS.USER_NOT_FOUND);

    const lead = await Lead.create(leadData, {
      ...(t && { transaction: t })
    });

    if (users && Array.isArray(users)) {
      await lead.$set('users', users, t ? { transaction: t } : undefined);
    }

    if (!t) {
      await createActivityLog('lead', 'create', lead.id, adminId, undefined, 'Lead created successfully');
    }

    if (foundUsers.length !== 1) {
      await notificationService.sendAssignLeadNotification({
        userId: adminId,
        target: lead.id
      });
    }

    io.emit('lead:created', lead); // Emit event after creation
    return lead;
  }

  async errorIfLeadWithExistEmail(email: string, id?: string, tenantId?: string): Promise<void> {
    const leadWithEmail = await Lead.findOne({ where: { email, ...(id && { id: { [Op.ne]: id } }), ...(tenantId && { tenantId }) } });
    if (leadWithEmail) throw new BaseError(ERRORS.EMAIL_ALREADY_EXISTS);
  }

  async errorIfLeadWithExistPhone(phone: string, id?: string, tenantId?: string): Promise<void> {
    const leadWithPhone = await Lead.findOne({ where: { phone, ...(id && { id: { [Op.ne]: id } }), ...(tenantId && { tenantId }) } });
    if (leadWithPhone) throw new BaseError(ERRORS.PHONE_ALREADY_EXISTS);
  }

  async updateLead(id: string, input: unknown, user: User): Promise<unknown> {
    await this.validateLeadAccess(id, user);
    const lead = await this.leadOrError({ id });

    if (input.email) await this.errorIfLeadWithExistEmail(input.email, lead.id);
    if (input.phone) await this.errorIfLeadWithExistPhone(input.phone, lead.id);

    // 🧠 Recalculate Score on Update
    const updatedData = { ...lead.toJSON(), ...input };
    input.score = this.calculateScore(updatedData);

    const users = input.users?.filter((item: number) => !lead.users?.map(e => e.id).includes(item));

    if (users?.length) {
      for (const item of users) {
        await notificationService.sendAssignLeadNotification({ userId: item, target: lead.id });
      }
    }
    if (input.users && Array.isArray(input.users)) await lead.$set('users', input.users);
    lead.set(input);
    await createActivityLog('lead', 'update', lead.id, user.id, null, `New updates added successfully`);
    users?.length && (await notificationService.sendAssignLeadNotification({ userId: user.id, target: lead.id }));
    const updatedLead = await lead.save();
    io.emit('lead:updated', updatedLead); // Emit event after update
    return updatedLead;
  }

  async leadOrError(filter: WhereOptions, joinedTables?: Includeable[]): Promise<Lead> {
    const lead = await Lead.findOne({ where: filter, include: joinedTables || [] });
    if (!lead) throw new BaseError(ERRORS.LEAD_NOT_FOUND);
    return lead;
  }

  async getLeads(query: unknown, user: User): Promise<unknown> {
    const { page, limit, offset } = clampPagination(query);

    if (!user.role.permissions.includes(LeadPermissionsEnum.VIEW_GLOBAL_LEADS)) query.userId = user.id;

    const { rows: leads, count: totalItems } = await Lead.findAndCountAll({
      where: {
        ...tenantWhere(user),
        status: {
          [Op.ne]: LeadStatusEnums.CONVERTED
        },
        ...(query.searchKey && {
          [Op.or]: [
            { name: { [Op.iLike]: `%${query.searchKey}%` } },
            { companyName: { [Op.iLike]: `%${query.searchKey}%` } },
            { email: { [Op.iLike]: `%${query.searchKey}%` } },
            { phone: { [Op.iLike]: `%${query.searchKey}%` } },
            { otherSource: { [Op.iLike]: `%${query.searchKey}%` } }
          ]
        }),
        ...(query.status &&
          query.status.length > 0 && {
            status: {
              [Op.in]: query.status // Matches any value in the array
            }
          }),
        ...(query.leadSource &&
          query.leadSource.length > 0 && {
            leadSource: {
              [Op.in]: query.leadSource // Matches any value in the array
            }
          }),
        ...((query.fromDate || query.toDate) && {
          createdAt: {
            ...(query.fromDate && { [Op.gte]: new Date(query.fromDate) }),
            ...(query.toDate && { [Op.lte]: new Date(query.toDate) })
          }
        }),
        ...((query.fromLastContactDate || query.toLastContactDate) && {
          lastContactDate: {
            ...(query.fromLastContactDate && { [Op.gte]: new Date(query.fromLastContactDate) }),
            ...(query.toLastContactDate && { [Op.lte]: new Date(query.toLastContactDate) })
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
      docs: leads,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit)
      }
    };
  }

  async leadById(id: string, user: User): Promise<unknown> {
    await this.validateLeadAccess(id, user);

    const lead = await Lead.findByPk(id, {
      include: [
        {
          model: User,
          as: 'users',
          attributes: ['id', 'name', 'email'],
          through: { attributes: [] }
        }
      ]
    });
    if (!lead) throw new BaseError(ERRORS.LEAD_NOT_FOUND);
    return lead;
  }

  public async importFile(file: unknown): Promise<string> {
    const workbook = xlsx.read(file.data);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    const data: Omit<Lead, 'id'>[] = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    const leadArray = [];

    for (let index = 1; index < data.length; index++) {
      const [name, companyName, email, phone, otherSource, leadSource, status, userId, notes, lastContactDate] = data[index] as any;
      if (!email && !phone) {
        throw new BaseError(ERRORS.LEAD_ALREADY_FOUND, 400, `Lead must have at least Phone or email in row ${index}`);
      }
      const existingEmailPhone = await Lead.findOne({
        where: {
          [Op.or]: [{ phone: `+${phone}` }, { email: email }]
        }
      });
      if (existingEmailPhone)
        throw new BaseError(
          ERRORS.LEAD_ALREADY_FOUND,
          400,
          `Lead ${existingEmailPhone.phone === phone ? 'Phone' : 'email'} in row ${index} already exists in the system `
        );
      const emails = userId ? String(userId).split(',') : [];
      const existingUsers = emails.length
        ? await User.findAll({
            where: {
              email: {
                [Op.in]: emails
              }
            },
            attributes: ['id', 'email']
          })
        : [];
      leadArray.push({
        name: name,
        companyName: companyName,
        email: email,
        phone: phone,
        otherSource: otherSource,
        leadSource: leadSource,
        status: status || LeadStatusEnums.NEW,
        users: existingUsers?.length && existingUsers.map(user => user.id)[0],
        userIds: existingUsers.map(user => user.id),
        notes: notes,
        lastContactDate: lastContactDate
      });
    }

    const createdLeads = await Lead.bulkCreate(leadArray);
    // Set user associations for each lead
    for (const lead of createdLeads) {
      const leadData = leadArray.find((l: unknown) => l.name === lead.name);
      if (leadData?.userIds && leadData.userIds.length > 0) {
        await (lead as any).$set('users', leadData.userIds);
      }
    }

    return leadArray.length + ' leads created succesfully';
  }
  streamToBuffer(stream: unknown) {
    return new Promise((resolve, reject) => {
      const _buf = Array<any>();
      stream.on('data', (chunk: unknown) => _buf.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(_buf)));
      stream.on('error', (err: unknown) => reject(err));
    });
  }

  public async deleteLead(id: string, user: User): Promise<void> {
    await this.validateLeadAccess(id, user);
    const lead = await Lead.findByPk(id);
    if (!lead) throw new BaseError(ERRORS.LEAD_NOT_FOUND);
    await createActivityLog('lead', 'delete', lead.id, user.id, null, 'Lead deleted');
    await lead.destroy();
  }

  public async validateLeadAccess(leadId: string, user: User): Promise<void> {
    if (user.role.permissions.includes(LeadPermissionsEnum.VIEW_GLOBAL_LEADS)) return;

    const isAssigned = await this.isUserAssignedToLead(leadId, user.id);
    if (!isAssigned) throw new BaseError(ERRORS.ACCESS_DENIED);
  }

  private async isUserAssignedToLead(leadId: string, userId: number): Promise<boolean> {
    const assignment = await LeadUsers.findOne({ where: { leadId, userId } });
    return !!assignment; // Returns true if assigned, false otherwise
  }

  /**
   * Calculate lead score using the configurable rules engine.
   *
   * Maps internal lead field names (e.g. companyName, leadSource, users) to the
   * canonical rule field names (company, source, assignedUsers) so the default
   * rules work out-of-the-box regardless of the field naming convention used
   * by callers.
   *
   * Accepts an optional custom rule set; defaults to DEFAULT_SCORING_RULES.
   */
  calculateScore(lead: unknown, rules?: ScoringRule[]): number {
    // Normalise lead fields to the canonical names used by the scoring rules
    const normalised: Record<string, any> = {
      ...lead,
      // Alias mappings for backward compatibility
      company: lead.company || lead.companyName,
      source: lead.source || lead.leadSource,
      assignedUsers: lead.assignedUsers || lead.users,
    };

    return evaluateScore(normalised, rules);
  }

  async sendLeadsExcelByEmail(query: unknown, user: User, email: string): Promise<void> {
    const where: Record<string, unknown> = {
      status: { [Op.ne]: LeadStatusEnums.CONVERTED },
      ...(query.searchKey && {
        [Op.or]: [
          { name: { [Op.iLike]: `%${query.searchKey}%` } },
          { companyName: { [Op.iLike]: `%${query.searchKey}%` } },
          { email: { [Op.iLike]: `%${query.searchKey}%` } },
          { phone: { [Op.iLike]: `%${query.searchKey}%` } },
          { otherSource: { [Op.iLike]: `%${query.searchKey}%` } }
        ]
      }),
      ...(query.status?.length && { status: { [Op.in]: query.status } }),
      ...(query.leadSource?.length && { leadSource: { [Op.in]: query.leadSource } }),
      ...((query.fromDate || query.toDate) && {
        createdAt: {
          ...(query.fromDate && { [Op.gte]: new Date(query.fromDate) }),
          ...(query.toDate && { [Op.lte]: new Date(query.toDate) })
        }
      }),
      ...((query.fromLastContactDate || query.toLastContactDate) && {
        lastContactDate: {
          ...(query.fromLastContactDate && { [Op.gte]: new Date(query.fromLastContactDate) }),
          ...(query.toLastContactDate && { [Op.lte]: new Date(query.toLastContactDate) })
        }
      })
    };

    if (!user.role.permissions.includes(LeadPermissionsEnum.VIEW_GLOBAL_LEADS)) {
      where['$users.id$'] = user.id;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Leads');

    worksheet.columns = [
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Phone', key: 'phone', width: 20 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Company', key: 'companyName', width: 30 },
      { header: 'Source', key: 'leadSource', width: 20 },
      { header: 'Status', key: 'status', width: 20 },
      { header: 'Users', key: 'users', width: 30 },
      { header: 'Created At', key: 'createdAt', width: 25 }
    ];

    const batchSize = 1000;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const leadsBatch = await Lead.findAll({
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

      for (const lead of leadsBatch) {
        const userNames = (lead.users || []).map(u => u.name).join(', ');
        worksheet.addRow({
          name: lead.name,
          phone: lead.phone,
          email: lead.email,
          companyName: lead.companyName,
          leadSource: lead.leadSource,
          status: lead.status,
          users: userNames,
          createdAt: lead.createdAt
        });
      }

      hasMore = leadsBatch.length === batchSize;
      offset += batchSize;
    }

    const buffer = await workbook.xlsx.writeBuffer();

    const attachment = Buffer.from(buffer).toString('base64');
    await sendEmail({
      to: email,
      subject: 'Leads Report',
      text: 'Attached is the Excel file with all leads.',
      attachment: {
        name: 'leads.xlsx',
        content: attachment
      }
    });
  }
}

export default new LeadService();
