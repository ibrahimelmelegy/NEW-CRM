import { isArray } from 'class-validator';
import { Includeable, Op, Transaction, WhereOptions } from 'sequelize';
import Client from '../client/clientModel';
import { sequelize } from '../config/db';
import { LeadStatusEnums, SortEnum } from '../lead/leadEnum';
import Lead from '../lead/leadModel';
import leadService from '../lead/leadService';
import { OpportunityStageEnums } from '../opportunity/opportunityEnum';
import Opportunity from '../opportunity/opportunityModel';
import { IPaginationRes } from '../types';
import User from '../user/userModel';
import BaseError from '../utils/error/base-http-exception';
import { ERRORS } from '../utils/error/errors';
import { DealSortByEnum, DealStageEnums } from './dealEnum';
import { AssignUserToDealInput } from './inputs/assign-user-to-deal.input';
import { ConvertLeadToDealInput, CreateLeadAndDealInput } from './inputs/convert-lead-to-deal.input';
import { CreateDealInvoiceInput, CreateDeliveryDetailsInput } from './inputs/creteDealInput';
import { GetPaginatedDealsInput } from './inputs/paginated-deals.input';
import { UpdateDealInput } from './inputs/update-deal.input';
import DealDelivery from './model/dealDeliveryModel';
import Deal from './model/dealModel';
import Invoice from './model/invoiceMode';
import { createActivityLog } from '../activity-logs/activityService';
import notificationService from '../notification/notificationService';
import { DealPermissionsEnum } from '../role/roleEnum';
import DealUsers from './model/deal_UsersModel';
import userService from '../user/userService';
import * as ExcelJS from 'exceljs';
import { sendEmail } from '../utils/emailHelper';
import clientService from '../client/clientService';
import projectService from '../project/projectService';
import { ProjectCategoryEnum, ProjectStatusEnum } from '../project/projectEnum';
import { tenantWhere, tenantCreate } from '../utils/tenantScope';
import { clampPagination } from '../utils/pagination';
import { io } from '../server';
import { TriggerType } from '../workflow/workflowModel';
import workflowService from '../workflow/workflowService';

/**
 * Defines which stage transitions are allowed for deals.
 * Key = current stage, Value = array of stages that can be transitioned to.
 * CONVERTED is an internal stage set during lead conversion and cannot be manually entered.
 */
const DEAL_STAGE_TRANSITIONS: Record<string, string[]> = {
  [DealStageEnums.PROGRESS]: [DealStageEnums.NEGOTIATION, DealStageEnums.CLOSED, DealStageEnums.CANCELLED],
  [DealStageEnums.NEGOTIATION]: [DealStageEnums.PROGRESS, DealStageEnums.CLOSED, DealStageEnums.CANCELLED],
  [DealStageEnums.CLOSED]: [DealStageEnums.ARCHIVED],
  [DealStageEnums.CANCELLED]: [DealStageEnums.PROGRESS],
  [DealStageEnums.ARCHIVED]: [],
  [DealStageEnums.CONVERTED]: []
};

/**
 * Auto-assigned probability percentages per deal stage.
 * These represent the likelihood of closing the deal at each stage.
 */
const DEAL_STAGE_PROBABILITY: Record<string, number> = {
  [DealStageEnums.PROGRESS]: 25,
  [DealStageEnums.NEGOTIATION]: 50,
  [DealStageEnums.CLOSED]: 100,
  [DealStageEnums.CANCELLED]: 0,
  [DealStageEnums.ARCHIVED]: 100,
  [DealStageEnums.CONVERTED]: 100
};

class DealService {
  public async convertLeadTODeal(input: ConvertLeadToDealInput & { userId: string }, admin: User): Promise<Deal> {
    let lead: any,
      client: any = null;
    const transaction = await sequelize.transaction();
    try {
      lead = await leadService.leadOrError({ id: input.leadId });
      lead.set({ status: LeadStatusEnums.CONVERTED });
      await lead.save({ transaction });

      client = await Client.findOne({ where: { email: lead.email } });
      if (client) throw new BaseError(ERRORS.CLIENT_ALREADY_FOUND);

      client = await Client.create(
        {
          clientName: lead.name,
          email: lead.email,
          phoneNumber: lead.phone,
          companyName: lead.companyName
        },
        { transaction }
      );

      let opportunity = null;
      if (input.opportunityId) {
        opportunity = await Opportunity.findByPk(input.opportunityId);
        if (!opportunity) throw new BaseError(ERRORS.OPPORTUNITY_NOT_FOUND);
      }
      const exitingDeal = await Deal.findOne({
        where: {
          name: input.name,
          companyName: input.companyName
        },
        attributes: ['name', 'companyName']
      });
      if (exitingDeal) throw new BaseError(ERRORS.DEAL_ALREADY_EXIST);
      if (input.stage !== DealStageEnums.CANCELLED) {
        delete input.cancelledReason;
      }

      if (!input.users || !Array.isArray(input.users)) {
        input.users = [admin.id];
      } else if (!input.users.includes(admin.id)) {
        input.users.push(admin.id);
      }

      const deal = await Deal.create(
        {
          ...input,
          leadId: lead?.id,
          clientId: client?.id
        },
        { transaction }
      );

      if (input.deliveryDetails?.length) {
        await this.createDealDeliveryDetails(deal.id, input.deliveryDetails, transaction);
      }
      if (input.invoiceDetails?.length) {
        await this.createDealInvoice(deal.id, input.invoiceDetails, transaction);
      }

      if (opportunity) {
        opportunity.set({
          stage: OpportunityStageEnums.CONVERTED
        });
        await opportunity.save({ transaction });
      }
      if (input.users && Array.isArray(input.users))
        await deal.$set('users', input.users, {
          transaction
        });
      await transaction.commit();
      if (input.users) {
        await Promise.all(
          input.users.map((item: number) => notificationService.sendAssignDealNotification({ userId: item, target: deal.id }, deal, admin))
        );
      }
      await createActivityLog('deal', 'create', deal.id, admin.id, null, 'Deal created succesfully from lead conversion');

      // Trigger workflow automation for deal creation (from lead conversion)
      workflowService.processEntityEvent('deal', String(deal.id), TriggerType.ON_CREATE, null, deal.toJSON(), admin.id).catch((err: Error) => {
        console.error('Workflow processEntityEvent (deal.convertCreate) error:', err.message);
      });

      return deal;
    } catch (error) {
      await transaction.rollback();
      throw new BaseError(ERRORS[(error as any)?.message as keyof typeof ERRORS] || ERRORS.SOMETHING_WENT_WRONG);
    }
  }

  public async createDeal(input: CreateLeadAndDealInput, admin: User): Promise<Deal> {
    // Parallel validation: check users + duplicate in one round-trip
    const userIds = input.deal.users && Array.isArray(input.deal.users) ? input.deal.users : [];
    const [users, exitingDeal] = await Promise.all([
      userIds.length ? User.findAll({ where: { id: { [Op.in]: userIds } } }) : Promise.resolve([]),
      Deal.findOne({ where: { name: input.deal.name, companyName: input.deal.companyName }, attributes: ['name', 'companyName'] })
    ]);
    if (userIds.length && !users.length) throw new BaseError(ERRORS.USER_NOT_FOUND);
    if (exitingDeal) throw new BaseError(ERRORS.DEAL_ALREADY_EXIST);
    if (input.deal.stage !== DealStageEnums.CANCELLED) delete input.deal.cancelledReason;

    const t = await sequelize.transaction();
    try {
      let lead,
        client = null;

      if (!input.clientId) {
        const existingLead = await Lead.findOne({
          where: {
            email: input.lead?.email
          }
        });

        if (existingLead) throw new BaseError(ERRORS.LEAD_ALREADY_FOUND);
        lead = await leadService.createLead({ ...input.lead, status: LeadStatusEnums.CONVERTED }, admin.id, t);

        const existingClient = await Client.findOne({
          where: {
            email: input.lead?.email
          }
        });
        if (existingClient) throw new BaseError(ERRORS.CLIENT_ALREADY_FOUND);
        client = await Client.create(
          {
            clientName: lead.name,
            email: lead.email,
            phoneNumber: lead.phone,
            companyName: lead.companyName
          },
          { transaction: t }
        );
      } else {
        client = await clientService.clientOrError({ id: input.clientId });
      }

      if (!input.deal.users || !Array.isArray(input.deal.users)) {
        input.deal.users = [admin.id];
      } else if (!input.deal.users.includes(admin.id)) {
        input.deal.users.push(admin.id);
      }

      const deal = await Deal.create(
        {
          ...input.deal,
          leadId: (lead as any)?.id,
          clientId: (client as any)?.id
        },
        {
          transaction: t
        }
      );
      if (input.deal.users && Array.isArray(input.deal.users))
        await deal.$set('users', input.deal.users, {
          transaction: t
        });
      if (input.deal.users) {
        await Promise.all(
          input.deal.users.map((item: number) => notificationService.sendAssignDealNotification({ userId: item, target: deal.id }, deal, admin))
        );
      }
      if (input.deliveryDetails?.length) {
        await this.createDealDeliveryDetails(deal.id, input.deliveryDetails, t);
      }
      if (input.invoiceDetails?.length) {
        await this.createDealInvoice(deal.id, input.invoiceDetails, t);
      }
      await createActivityLog('deal', 'create', deal.id, admin.id, t, 'Deal created succesfully');
      await t.commit();

      // Trigger workflow automation for deal creation
      workflowService.processEntityEvent('deal', String(deal.id), TriggerType.ON_CREATE, null, deal.toJSON(), admin.id).catch((err: Error) => {
        console.error('Workflow processEntityEvent (deal.create) error:', err.message);
      });

      return deal;
    } catch (error: Error | unknown) {
      await t.rollback();
      throw new BaseError(ERRORS[(error as any)?.message as keyof typeof ERRORS] || ERRORS.SOMETHING_WENT_WRONG);
    }
  }

  public async getDeals(query: GetPaginatedDealsInput, user: User): Promise<IPaginationRes<Deal>> {
    const { page, limit, offset } = clampPagination(query);

    if (!user.role.permissions.includes(DealPermissionsEnum.VIEW_GLOBAL_DEALS)) query.userId = user.id;

    const { rows: deals, count: totalItems } = await Deal.findAndCountAll({
      attributes: ['id', 'name', 'companyName', 'price', 'stage', 'contractType', 'probability', 'signatureDate', 'leadId', 'clientId', 'createdAt', 'updatedAt'],
      where: {
        ...tenantWhere(user),
        stage: {
          [Op.ne]: DealStageEnums.CONVERTED
        },
        ...(query.searchKey && {
          [Op.or]: [{ name: { [Op.iLike]: `%${query.searchKey}%` } }, { companyName: { [Op.iLike]: `%${query.searchKey}%` } }]
        }),
        ...(query?.stage &&
          isArray(query.stage) &&
          query.stage.length && {
            stage: {
              [Op.in]: query.stage
            }
          }),
        ...(query?.contractType &&
          isArray(query.contractType) &&
          query.contractType.length && {
            contractType: {
              [Op.in]: query.contractType
            }
          }),
        ...((query.fromDate || query.toDate) && {
          createdAt: {
            ...(query.fromDate && { [Op.gte]: new Date(query.fromDate) }),
            ...(query.toDate && { [Op.lte]: new Date(query.toDate) })
          }
        }),
        ...((query.fromPrice || query.toPrice) && {
          price: {
            ...(query.fromPrice && { [Op.gte]: query.fromPrice }),
            ...(query.toPrice && { [Op.lte]: query.toPrice })
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
          query.sortBy && Object.keys(DealSortByEnum).includes(query.sortBy) ? query.sortBy : 'createdAt',
          query.sort && Object.values(SortEnum).includes(query.sort) ? query.sort : SortEnum.DESC
        ]
      ]
    });

    return {
      docs: deals,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit)
      }
    };
  }

  public async getDealById(id: string, user: User): Promise<Deal> {
    await this.validateDealAccess(id, user);

    const deal = await this.dealOrError({ id }, [
      {
        model: User,
        as: 'users',
        attributes: ['id', 'name', 'email'],
        through: { attributes: [] }
      },
      {
        model: Client,
        as: 'client',
        attributes: ['id', 'clientName', 'email']
      },
      Invoice,
      DealDelivery
    ]);
    return deal;
  }

  public async assignUserToDeal(input: AssignUserToDealInput, user: User): Promise<Deal> {
    await this.validateDealAccess(input.dealId, user);

    const deal = await this.dealOrError({ id: input.dealId });

    await userService.userOrError({ id: input.userId });

    deal.set({ userId: input.userId });

    await notificationService.sendAssignDealNotification({ userId: input.userId, target: deal.id }, deal, user);

    await createActivityLog('deal', 'assign', deal.id, user.id, null, `User with Id ${user.id} assigined succesfully`);

    return await deal.save();
  }

  public async updateDeal(input: UpdateDealInput, user: User): Promise<Deal> {
    await this.validateDealAccess(input.dealId, user);

    const deal = await this.dealOrError({ id: input.dealId });
    // Capture old data for workflow field-change detection
    const oldDealData = deal.toJSON();

    if (input.name && input.companyName) {
      const existingDeal = await Deal.findOne({
        where: {
          id: { [Op.ne]: input.dealId },
          name: input.name,
          companyName: input.companyName
        },
        attributes: ['name', 'companyName', 'id']
      });
      if (existingDeal) throw new BaseError(ERRORS.DEAL_ALREADY_EXIST);
    }
    const users = input.users?.filter((item: number) => !deal.users.map(e => e.id).includes(item));

    input.invoiceDetails?.length && (await this.createOrUpdateDealInvoice(input.dealId, input.invoiceDetails, user));
    input.deliveryDetails?.length && (await this.createOrUpdateDealDeliveryDetails(input.dealId, input.deliveryDetails, user));

    input.deletedDeliveryIds?.length && (await DealDelivery.destroy({ where: { id: { [Op.in]: input.deletedDeliveryIds } } }));
    input.deletedInvoiceIds?.length && (await Invoice.destroy({ where: { id: { [Op.in]: input.deletedInvoiceIds } } }));

    delete input.deletedDeliveryIds;
    delete input.deletedInvoiceIds;
    delete input.invoiceDetails;
    delete input.deliveryDetails;

    // If the update includes a stage change, validate the transition and auto-set probability
    if (input.stage && input.stage !== deal.stage) {
      if (input.stage === DealStageEnums.CONVERTED) {
        throw new BaseError(ERRORS.SOMETHING_WENT_WRONG);
      }
      this.validateDealStageTransition(deal.stage, input.stage);
      input.probability = DEAL_STAGE_PROBABILITY[input.stage] ?? 0;
    }

    deal.set({
      ...input
    });
    if (users?.length) {
      await Promise.all(users.map((item: number) => notificationService.sendAssignDealNotification({ userId: item, target: deal.id }, deal, user)));
    }
    await createActivityLog('deal', 'update', deal.id, user.id, null, `New updates added suucesfully`);
    await deal.save();
    if (input.users && Array.isArray(input.users)) await deal.$set('users', input.users);

    // Trigger workflow automation for deal update (including field change detection)
    const newDealData = deal.toJSON();
    workflowService.processEntityEvent('deal', String(deal.id), TriggerType.ON_UPDATE, oldDealData, newDealData, user.id).catch((err: Error) => {
      console.error('Workflow processEntityEvent (deal.update) error:', err.message);
    });

    return await this.getDealById(deal.id, user);
  }

  public async createOrUpdateDealInvoice(dealId: string, input: CreateDealInvoiceInput[], user: User) {
    await this.validateDealAccess(dealId, user);

    const newInvoice: Partial<Invoice>[] = [];
    const updateInvoice: Partial<Invoice>[] = [];

    input!.forEach(e => (e.id ? updateInvoice.push(e) : newInvoice.push({ ...e, dealId })));
    await Invoice.bulkCreate(newInvoice as []);

    await Promise.all(updateInvoice.map(async e => await Invoice.update(e, { where: { id: e.id } })));
  }

  public async createOrUpdateDealDeliveryDetails(dealId: string, input: CreateDeliveryDetailsInput[], user: User) {
    await this.validateDealAccess(dealId, user);

    const newDeliveryDetails: Partial<DealDelivery>[] = [];
    const updateDeliveryDetails: Partial<DealDelivery>[] = [];
    input!.forEach(e => (e.id ? updateDeliveryDetails.push(e) : newDeliveryDetails.push({ ...e, dealId })));

    newDeliveryDetails.length && (await DealDelivery.bulkCreate(newDeliveryDetails));
    await Promise.all(updateDeliveryDetails.map(async e => await DealDelivery.update(e, { where: { id: e.id } })));
  }

  public async createDealInvoice(dealId: string, input: CreateDealInvoiceInput[], TX?: Transaction) {
    // const existingDeal = await Deal.findByPk(dealId, { transaction: TX });
    // if (!existingDeal) throw new BaseError(ERRORS.DEAL_NOT_FOUND);

    return await Invoice.bulkCreate(
      input.map(e => ({
        ...e,
        dealId
      })),
      {
        transaction: TX
      }
    );
  }

  public async createDealDeliveryDetails(dealId: string, input: CreateDeliveryDetailsInput[], TX?: Transaction) {
    // const existingDeal = await Deal.findByPk(dealId, { transaction: TX });
    // if (!existingDeal) throw new BaseError(ERRORS.DEAL_NOT_FOUND);

    return await DealDelivery.bulkCreate(
      input.map(e => ({
        ...e,
        dealId
      })),
      {
        transaction: TX
      }
    );
  }

  public async getKanbanDeals(user: User): Promise<Record<string, Deal[]>> {
    const where: Record<string, any> = {
      stage: { [Op.ne]: DealStageEnums.CONVERTED }
    };

    const include: Includeable[] = [
      {
        model: User,
        as: 'users',
        attributes: ['id', 'name', 'email'],
        through: { attributes: [] },
        ...(!user.role.permissions.includes(DealPermissionsEnum.VIEW_GLOBAL_DEALS) && {
          required: true,
          where: { id: user.id }
        })
      }
    ];

    const deals = await Deal.findAll({
      where,
      include,
      attributes: ['id', 'name', 'companyName', 'price', 'stage', 'contractType', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: 500
    });

    const grouped: Record<string, Deal[]> = {
      [DealStageEnums.PROGRESS]: [],
      [DealStageEnums.NEGOTIATION]: [],
      [DealStageEnums.CLOSED]: [],
      [DealStageEnums.CANCELLED]: [],
      [DealStageEnums.ARCHIVED]: []
    };

    deals.forEach(deal => {
      if (grouped[deal.stage]) {
        grouped[deal.stage].push(deal);
      }
    });

    return grouped;
  }

  public async updateDealStage(dealId: string, stage: DealStageEnums, user: User): Promise<Deal> {
    await this.validateDealAccess(dealId, user);
    const deal = await this.dealOrError({ id: dealId });

    if (!Object.values(DealStageEnums).includes(stage) || stage === DealStageEnums.CONVERTED) {
      throw new BaseError(ERRORS.SOMETHING_WENT_WRONG);
    }

    // Validate that this stage transition is allowed
    this.validateDealStageTransition(deal.stage, stage);

    // Capture old data for workflow field-change detection
    const oldStageData = deal.toJSON();

    // Auto-set probability based on the new stage
    const fromStage = deal.stage;
    const probability = DEAL_STAGE_PROBABILITY[stage] ?? 0;
    deal.set({ stage, probability });
    await deal.save();

    // Emit detailed stage change event via Socket.io
    io.emit('deal:stage_changed', { dealId, fromStage, toStage: stage, userId: user.id });

    // Emit semantic won/lost events for dashboard widgets and notifications
    if (stage === DealStageEnums.CLOSED) {
      io.emit('deal:won', { dealId, name: deal.name, price: deal.price, userId: user.id });
    } else if (stage === DealStageEnums.CANCELLED) {
      io.emit('deal:lost', { dealId, name: deal.name, price: deal.price, userId: user.id });
    }

    // --> ORCHESTRATION: Auto-create Project on Deal Won (CLOSED)
    if (stage === DealStageEnums.CLOSED) {
      try {
        await projectService.createProject(
          {
            basicInfo: {
              name: `${deal.name} - Auto Project`,
              type: 'Development', // default
              category: ProjectCategoryEnum.Direct,
              clientId: deal.clientId,
              dealId: deal.id,
              duration: 30, // Default duration
              status: ProjectStatusEnum.ACTIVE,
              assignedUsersIds: [user.id],
              etimadInfo: {} as any // Bypass strict TS check for non-Etimad projects
            }
          },
          user
        );
        await createActivityLog('deal', 'update', deal.id, user.id, null, `Auto-generated Project for Winning Deal`);
      } catch (err: any) {
        // Log but don't fail the deal update if project creation fails (graceful degradation)
        console.error('Failed to auto-create project from deal:', err.message);
      }
    }

    await createActivityLog('deal', 'update', deal.id, user.id, null, `Deal stage changed to ${stage}`);

    // Trigger workflow automation for deal stage change (ON_UPDATE + ON_FIELD_CHANGE)
    const newStageData = deal.toJSON();
    workflowService.processEntityEvent('deal', String(deal.id), TriggerType.ON_UPDATE, oldStageData, newStageData, user.id).catch((err: Error) => {
      console.error('Workflow processEntityEvent (deal.stageChange) error:', err.message);
    });

    return deal;
  }

  /**
   * Validates that a deal stage transition is allowed.
   * Throws INVALID_STAGE_TRANSITION if the transition is not permitted.
   */
  private validateDealStageTransition(currentStage: string, newStage: string): void {
    const allowed = DEAL_STAGE_TRANSITIONS[currentStage];
    if (!allowed || !allowed.includes(newStage)) {
      throw new BaseError(ERRORS.INVALID_STAGE_TRANSITION);
    }
  }

  async dealOrError(filter: WhereOptions, joinedTables?: Includeable[]): Promise<Deal> {
    const deal = await Deal.findOne({ where: filter, include: joinedTables || [] });
    if (!deal) throw new BaseError(ERRORS.DEAL_NOT_FOUND);
    return deal;
  }

  public async deleteDeal(id: string, user: User): Promise<void> {
    await this.validateDealAccess(id, user);
    const deal = await this.dealOrError({ id });
    await createActivityLog('deal', 'delete', deal.id, user.id, null, 'Deal deleted');
    await deal.destroy();
  }

  public async validateDealAccess(dealId: string, user: User): Promise<void> {
    if (user.role.permissions.includes(DealPermissionsEnum.VIEW_GLOBAL_DEALS)) return;

    const isAssigned = await this.isUserAssignedToDeal(dealId, user.id);
    if (!isAssigned) throw new BaseError(ERRORS.ACCESS_DENIED);
  }

  private async isUserAssignedToDeal(dealId: string, userId: number): Promise<boolean> {
    const assignment = await DealUsers.findOne({ where: { dealId, userId } });
    return !!assignment; // Returns true if assigned, false otherwise
  }

  // ─── Enterprise Analytics: Weighted Pipeline ──────────────────────────────
  public async getWeightedPipeline(tenantId?: string): Promise<{
    totalPipelineValue: number;
    weightedValue: number;
    dealCount: number;
    byStage: Record<string, { count: number; totalValue: number; weightedValue: number; avgProbability: number }>;
  }> {
    const where: Record<string, any> = {
      stage: { [Op.notIn]: [DealStageEnums.CLOSED, DealStageEnums.CANCELLED, DealStageEnums.ARCHIVED, DealStageEnums.CONVERTED] },
      ...(tenantId ? { tenantId } : {})
    };

    const deals = await Deal.findAll({
      where,
      attributes: ['id', 'price', 'probability', 'stage'],
      raw: true
    });

    const byStage: Record<string, { count: number; totalValue: number; weightedValue: number; totalProbability: number }> = {};
    let totalPipelineValue = 0;
    let weightedValue = 0;

    for (const deal of deals) {
      const price = Number(deal.price) || 0;
      const prob = Number(deal.probability) || 0;
      const weighted = price * (prob / 100);

      totalPipelineValue += price;
      weightedValue += weighted;

      if (!byStage[deal.stage]) {
        byStage[deal.stage] = { count: 0, totalValue: 0, weightedValue: 0, totalProbability: 0 };
      }
      byStage[deal.stage].count += 1;
      byStage[deal.stage].totalValue += price;
      byStage[deal.stage].weightedValue += weighted;
      byStage[deal.stage].totalProbability += prob;
    }

    // Convert totalProbability to avgProbability
    const result: Record<string, { count: number; totalValue: number; weightedValue: number; avgProbability: number }> = {};
    for (const [stage, data] of Object.entries(byStage)) {
      result[stage] = {
        count: data.count,
        totalValue: data.totalValue,
        weightedValue: data.weightedValue,
        avgProbability: data.count > 0 ? Math.round((data.totalProbability / data.count) * 100) / 100 : 0
      };
    }

    return {
      totalPipelineValue,
      weightedValue: Math.round(weightedValue * 100) / 100,
      dealCount: deals.length,
      byStage: result
    };
  }

  // ─── Enterprise Analytics: Stale Deal Alerts ─────────────────────────────
  public async getStaleDealAlerts(tenantId?: string, staleDays: number = 14): Promise<any[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - staleDays);

    const deals = await Deal.findAll({
      where: {
        stage: { [Op.notIn]: [DealStageEnums.CLOSED, DealStageEnums.CANCELLED, DealStageEnums.ARCHIVED, DealStageEnums.CONVERTED] },
        updatedAt: { [Op.lt]: cutoffDate },
        ...(tenantId ? { tenantId } : {})
      },
      include: [
        {
          model: User,
          as: 'users',
          attributes: ['id', 'name', 'email'],
          through: { attributes: [] }
        }
      ],
      order: [['updatedAt', 'ASC']],
      attributes: ['id', 'name', 'companyName', 'price', 'stage', 'probability', 'updatedAt', 'createdAt']
    });

    const now = new Date();
    return deals.map(deal => {
      const plain = deal.toJSON() as any;
      const updatedAt = new Date(plain.updatedAt);
      plain.daysStale = Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));
      return plain;
    });
  }

  // ─── Enterprise Analytics: Win/Loss Analysis ─────────────────────────────
  public async getWinLossAnalysis(tenantId?: string, period?: { from?: string; to?: string }): Promise<{
    totalWon: number;
    totalLost: number;
    winRate: number;
    avgWonDealSize: number;
    avgLostDealSize: number;
    avgDaysToClose: number;
    byMonth: Array<{ month: string; won: number; lost: number; winRate: number }>;
  }> {
    const where: Record<string, any> = {
      stage: { [Op.in]: [DealStageEnums.CLOSED, DealStageEnums.CANCELLED] },
      ...(tenantId ? { tenantId } : {})
    };

    if (period?.from || period?.to) {
      where.updatedAt = {
        ...(period.from && { [Op.gte]: new Date(period.from) }),
        ...(period.to && { [Op.lte]: new Date(period.to) })
      };
    }

    const deals = await Deal.findAll({
      where,
      attributes: ['id', 'price', 'stage', 'createdAt', 'updatedAt'],
      raw: true
    });

    let totalWon = 0;
    let totalLost = 0;
    let wonValueSum = 0;
    let lostValueSum = 0;
    let totalDaysToClose = 0;
    let wonCount = 0;

    const monthMap: Record<string, { won: number; lost: number }> = {};

    for (const deal of deals) {
      const price = Number(deal.price) || 0;
      const createdAt = new Date(deal.createdAt);
      const updatedAt = new Date(deal.updatedAt);
      const daysToClose = Math.floor((updatedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      const monthKey = `${updatedAt.getFullYear()}-${String(updatedAt.getMonth() + 1).padStart(2, '0')}`;

      if (!monthMap[monthKey]) {
        monthMap[monthKey] = { won: 0, lost: 0 };
      }

      if (deal.stage === DealStageEnums.CLOSED) {
        totalWon++;
        wonValueSum += price;
        totalDaysToClose += daysToClose;
        wonCount++;
        monthMap[monthKey].won++;
      } else if (deal.stage === DealStageEnums.CANCELLED) {
        totalLost++;
        lostValueSum += price;
        monthMap[monthKey].lost++;
      }
    }

    const totalDeals = totalWon + totalLost;
    const winRate = totalDeals > 0 ? Math.round((totalWon / totalDeals) * 10000) / 100 : 0;
    const avgWonDealSize = wonCount > 0 ? Math.round(wonValueSum / wonCount) : 0;
    const avgLostDealSize = totalLost > 0 ? Math.round(lostValueSum / totalLost) : 0;
    const avgDaysToClose = wonCount > 0 ? Math.round(totalDaysToClose / wonCount) : 0;

    // Sort months chronologically
    const byMonth = Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        won: data.won,
        lost: data.lost,
        winRate: (data.won + data.lost) > 0
          ? Math.round((data.won / (data.won + data.lost)) * 10000) / 100
          : 0
      }));

    return {
      totalWon,
      totalLost,
      winRate,
      avgWonDealSize,
      avgLostDealSize,
      avgDaysToClose,
      byMonth
    };
  }

  public async sendDealsExcelByEmail(query: GetPaginatedDealsInput, user: User, email: string): Promise<void> {
    const where: Record<string, any> = {
      stage: {
        [Op.ne]: DealStageEnums.CONVERTED
      },
      ...(query.searchKey && {
        [Op.or]: [{ name: { [Op.iLike]: `%${query.searchKey}%` } }, { companyName: { [Op.iLike]: `%${query.searchKey}%` } }]
      }),
      ...(query.stage?.length &&
        isArray(query.stage) && {
          stage: { [Op.in]: query.stage }
        }),
      ...(query?.contractType &&
        isArray(query.contractType) &&
        query.contractType.length && {
          contractType: {
            [Op.in]: query.contractType
          }
        }),
      ...(query.fromDate || query.toDate
        ? {
            createdAt: {
              ...(query.fromDate && { [Op.gte]: new Date(query.fromDate) }),
              ...(query.toDate && { [Op.lte]: new Date(query.toDate) })
            }
          }
        : {}),
      ...(query.fromPrice || query.toPrice
        ? {
            price: {
              ...(query.fromPrice && { [Op.gte]: query.fromPrice }),
              ...(query.toPrice && { [Op.lte]: query.toPrice })
            }
          }
        : {})
    };

    if (!user.role.permissions.includes(DealPermissionsEnum.VIEW_GLOBAL_DEALS)) {
      where['$users.id$'] = user.id;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Deals');

    worksheet.columns = [
      { header: 'Deal Name', key: 'name', width: 30 },
      { header: 'Company Name', key: 'companyName', width: 30 },
      { header: 'Stage', key: 'stage', width: 20 },
      { header: 'Price', key: 'price', width: 15 },
      { header: 'Created At', key: 'createdAt', width: 25 }
    ];

    const batchSize = 1000;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const deals = await Deal.findAll({
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

      for (const deal of deals) {
        worksheet.addRow({
          name: deal.name,
          companyName: deal.companyName,
          stage: deal.stage,
          price: deal.price,
          createdAt: deal.createdAt
        });
      }

      hasMore = deals.length === batchSize;
      offset += batchSize;
    }

    const buffer = await workbook.xlsx.writeBuffer();

    const attachment = Buffer.from(buffer).toString('base64');
    await sendEmail({
      to: email,
      subject: 'Deals Export',
      text: 'Attached is the Excel file containing the filtered deals.',
      attachment: {
        name: 'deals.xlsx',
        content: attachment
      }
    });
  }
}

export default new DealService();
