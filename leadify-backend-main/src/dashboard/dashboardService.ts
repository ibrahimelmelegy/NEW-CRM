import { Op, fn, col, literal } from 'sequelize';
import Dashboard, { Widget, WidgetConfig } from './dashboardModel';
import Lead from '../lead/leadModel';
import Deal from '../deal/model/dealModel';
import Client from '../client/clientModel';
import Opportunity from '../opportunity/opportunityModel';
import Project from '../project/models/projectModel';
import Invoice from '../deal/model/invoiceMode';
import DailyTask from '../dailyTask/dailyTaskModel';
import User from '../user/userModel';
import { DealStageEnums } from '../deal/dealEnum';
import { LeadStatusEnums } from '../lead/leadEnum';
import { ProjectStatusEnum } from '../project/projectEnum';
import { DailyTaskStatusEnum } from '../dailyTask/dailyTaskEnum';
import BaseError from '../utils/error/base-http-exception';
import { ERRORS } from '../utils/error/errors';
import cacheService from '../infrastructure/cacheService';

const DASHBOARD_CACHE_TTL = 120; // 2 minutes

// Maps entity type strings to Sequelize model classes
function getModelByEntityType(entityType: string): any {
  const map: Record<string, unknown> = {
    lead: Lead,
    leads: Lead,
    deal: Deal,
    deals: Deal,
    client: Client,
    clients: Client,
    opportunity: Opportunity,
    opportunities: Opportunity,
    project: Project,
    projects: Project,
    invoice: Invoice,
    invoices: Invoice,
    daily_task: DailyTask,
    daily_tasks: DailyTask,
    task: DailyTask,
    tasks: DailyTask,
    user: User,
    users: User
  };
  return map[entityType?.toLowerCase()] || null;
}

// Build a date range WHERE clause from dateRange string
function buildDateRangeWhere(dateRange?: string, customFrom?: string, customTo?: string): any {
  if (!dateRange) return {};

  const now = new Date();
  let start: Date;
  let end: Date = new Date(now);

  switch (dateRange) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      break;
    case 'this_week': {
      const dayOfWeek = now.getDay();
      start = new Date(now);
      start.setDate(now.getDate() - dayOfWeek);
      start.setHours(0, 0, 0, 0);
      break;
    }
    case 'this_month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'this_quarter': {
      const quarter = Math.floor(now.getMonth() / 3);
      start = new Date(now.getFullYear(), quarter * 3, 1);
      break;
    }
    case 'this_year':
      start = new Date(now.getFullYear(), 0, 1);
      break;
    case 'custom':
      if (customFrom && customTo) {
        start = new Date(customFrom);
        end = new Date(customTo);
        end.setHours(23, 59, 59, 999);
      } else {
        return {};
      }
      break;
    default:
      return {};
  }

  return {
    createdAt: {
      [Op.between]: [start!, end]
    }
  };
}

// Build filter WHERE clause from widget filters
function buildFilterWhere(filters?: Array<{ field: string; operator: string; value: unknown }>): any {
  if (!filters || !filters.length) return {};

  const where: Record<string, unknown> = {};
  for (const filter of filters) {
    const { field, operator, value } = filter;
    switch (operator) {
      case 'equals':
      case 'eq':
        where[field] = value;
        break;
      case 'not_equals':
      case 'neq':
        where[field] = { [Op.ne]: value };
        break;
      case 'contains':
      case 'like':
        where[field] = { [Op.iLike]: `%${value}%` };
        break;
      case 'greater_than':
      case 'gt':
        where[field] = { [Op.gt]: value };
        break;
      case 'less_than':
      case 'lt':
        where[field] = { [Op.lt]: value };
        break;
      case 'gte':
        where[field] = { [Op.gte]: value };
        break;
      case 'lte':
        where[field] = { [Op.lte]: value };
        break;
      case 'between':
        if (Array.isArray(value) && value.length === 2) {
          where[field] = { [Op.between]: [value[0], value[1]] };
        }
        break;
      case 'in':
        where[field] = { [Op.in]: Array.isArray(value) ? value : [value] };
        break;
      case 'not_in':
        where[field] = { [Op.notIn]: Array.isArray(value) ? value : [value] };
        break;
      case 'is_null':
        where[field] = { [Op.is]: null as any };
        break;
      case 'is_not_null':
        where[field] = { [Op.not]: null as any };
        break;
    }
  }
  return where;
}

class DashboardService {
  // ─── CRUD ─────────────────────────────────────────────
  async createDashboard(data: Record<string, unknown>, userId: number) {
    return Dashboard.create({ ...data, userId });
  }

  async updateDashboard(id: number, data: Record<string, unknown>, userId: number) {
    const dashboard = await Dashboard.findOne({ where: { id, userId } });
    if (!dashboard) throw new BaseError(ERRORS.DASHBOARD_NOT_FOUND, 404);
    return dashboard.update(data);
  }

  async deleteDashboard(id: number, userId: number) {
    const dashboard = await Dashboard.findOne({ where: { id, userId } });
    if (!dashboard) throw new BaseError(ERRORS.DASHBOARD_NOT_FOUND, 404);
    await dashboard.destroy();
  }

  async getDashboards(userId: number, role?: string) {
    const whereClause: any = {
      [Op.or]: [{ userId }, { isShared: true }]
    };
    if (role) {
      whereClause[Op.or].push({ role });
    }

    return Dashboard.findAll({
      where: whereClause,
      order: [
        ['isDefault', 'DESC'],
        ['createdAt', 'DESC']
      ],
      include: [{ model: User, attributes: ['id', 'name', 'email'] }]
    });
  }

  async getDashboardById(id: number) {
    const dashboard = await Dashboard.findByPk(id, {
      include: [{ model: User, attributes: ['id', 'name', 'email'] }]
    });
    if (!dashboard) throw new BaseError(ERRORS.DASHBOARD_NOT_FOUND, 404);
    return dashboard;
  }

  async setDefault(id: number, userId: number) {
    // Remove default from all other dashboards for this user
    await Dashboard.update({ isDefault: false }, { where: { userId, isDefault: true } });
    // Set the chosen dashboard as default
    const dashboard = await Dashboard.findOne({ where: { id, userId } });
    if (!dashboard) throw new BaseError(ERRORS.DASHBOARD_NOT_FOUND, 404);
    return dashboard.update({ isDefault: true });
  }

  // ─── WIDGET DATA ENGINE ───────────────────────────────
  async getWidgetData(widget: Widget) {
    const { type, config } = widget;

    switch (type) {
      case 'stat_card':
        return this.getStatCardData(config);
      case 'chart':
        return this.getChartData(config);
      case 'table':
        return this.getTableData(config);
      case 'pipeline_funnel':
        return this.getPipelineFunnelData(config);
      case 'activity_feed':
        return this.getActivityFeedData(config);
      case 'task_list':
        return this.getTaskListData(config);
      case 'leaderboard':
        return this.getLeaderboardData(config);
      default:
        throw new BaseError(ERRORS.SOMETHING_WENT_WRONG);
    }
  }

  private async getStatCardData(config: WidgetConfig) {
    const Model = getModelByEntityType(config.entityType || '');
    if (!Model) throw new BaseError(ERRORS.SOMETHING_WENT_WRONG);

    const where: any = {
      ...buildDateRangeWhere(config.dateRange, config.customDateFrom, config.customDateTo),
      ...buildFilterWhere(config.filters)
    };

    const metric = config.metric || 'count';

    if (metric === 'count') {
      const count = await Model.count({ where });
      return { value: count };
    }

    if ((metric === 'sum' || metric === 'avg') && config.field) {
      const aggFn = metric === 'sum' ? fn('SUM', col(config.field)) : fn('AVG', col(config.field));
      const result = await Model.findOne({
        where,
        attributes: [[aggFn, 'result']],
        raw: true
      });
      return { value: Number(result?.result || 0) };
    }

    return { value: 0 };
  }

  private async getChartData(config: WidgetConfig) {
    const Model = getModelByEntityType(config.entityType || '');
    if (!Model) throw new BaseError(ERRORS.SOMETHING_WENT_WRONG);

    const where: any = {
      ...buildDateRangeWhere(config.dateRange, config.customDateFrom, config.customDateTo),
      ...buildFilterWhere(config.filters)
    };

    const groupBy = config.groupBy;
    if (!groupBy) {
      throw new BaseError(ERRORS.SOMETHING_WENT_WRONG);
    }

    const metric = config.metric || 'count';
    const field = config.field || 'id';

    let aggAttr: any;
    switch (metric) {
      case 'sum':
        aggAttr = [fn('SUM', col(field)), 'value'];
        break;
      case 'avg':
        aggAttr = [fn('AVG', col(field)), 'value'];
        break;
      case 'count':
      default:
        aggAttr = [fn('COUNT', col('id')), 'value'];
        break;
    }

    const results = await Model.findAll({
      where,
      attributes: [groupBy, aggAttr],
      group: [groupBy],
      order: [[literal('"value"'), 'DESC']],
      limit: config.limit || 20,
      raw: true
    });

    return {
      labels: results.map((r: any) => r[groupBy]),
      datasets: [
        {
          data: results.map((r: any) => Number(r.value || 0)),
          chartType: config.chartType || 'bar'
        }
      ]
    };
  }

  private async getTableData(config: WidgetConfig) {
    const Model = getModelByEntityType(config.entityType || '');
    if (!Model) throw new BaseError(ERRORS.SOMETHING_WENT_WRONG);

    const where: any = {
      ...buildDateRangeWhere(config.dateRange, config.customDateFrom, config.customDateTo),
      ...buildFilterWhere(config.filters)
    };

    const results = await Model.findAll({
      where,
      limit: config.limit || 25,
      order: [['createdAt', 'DESC']],
      raw: true
    });

    return { rows: results, total: results.length };
  }

  private async getPipelineFunnelData(config: WidgetConfig) {
    const dateWhere = buildDateRangeWhere(config.dateRange, config.customDateFrom, config.customDateTo);

    const [leads, opportunities, deals, closedDeals] = await Promise.all([
      Lead.count({ where: dateWhere }),
      Opportunity.count({ where: dateWhere }),
      Deal.count({ where: dateWhere }),
      Deal.count({ where: { ...dateWhere, stage: DealStageEnums.CLOSED } })
    ]);

    return {
      stages: [
        { name: 'Leads', value: leads },
        { name: 'Opportunities', value: opportunities },
        { name: 'Deals', value: deals },
        { name: 'Closed Won', value: closedDeals }
      ]
    };
  }

  private async getActivityFeedData(config: WidgetConfig) {
    const dateWhere = buildDateRangeWhere(config.dateRange, config.customDateFrom, config.customDateTo);
    const limit = config.limit || 15;

    // Pull recent leads, deals, opportunities with timestamps
    const [recentLeads, recentDeals, recentOpportunities] = await Promise.all([
      Lead.findAll({
        where: dateWhere,
        order: [['createdAt', 'DESC']],
        limit,
        attributes: ['id', 'name', 'status', 'createdAt'],
        raw: true
      }),
      Deal.findAll({
        where: dateWhere,
        order: [['createdAt', 'DESC']],
        limit,
        attributes: ['id', 'name', 'stage', 'price', 'createdAt'],
        raw: true
      }),
      Opportunity.findAll({
        where: dateWhere,
        order: [['createdAt', 'DESC']],
        limit,
        attributes: ['id', 'name', 'stage', 'estimatedValue', 'createdAt'],
        raw: true
      })
    ]);

    const activities = [
      ...recentLeads.map(l => ({ entityType: 'lead', ...l })),
      ...recentDeals.map(d => ({ entityType: 'deal', ...d })),
      ...recentOpportunities.map(o => ({ entityType: 'opportunity', ...o }))
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);

    return { activities };
  }

  private async getTaskListData(config: WidgetConfig) {
    const dateWhere = buildDateRangeWhere(config.dateRange, config.customDateFrom, config.customDateTo);
    const filterWhere = buildFilterWhere(config.filters);

    const tasks = await DailyTask.findAll({
      where: { ...dateWhere, ...filterWhere },
      order: [['createdAt', 'DESC']],
      limit: config.limit || 20,
      include: [
        { model: User, as: 'salesRepresentative', attributes: ['id', 'name'] },
        { model: Client, as: 'client', attributes: ['id', 'clientName'] }
      ]
    });

    return { tasks };
  }

  private async getLeaderboardData(config: WidgetConfig) {
    const dateWhere = buildDateRangeWhere(config.dateRange, config.customDateFrom, config.customDateTo);
    const limit = config.limit || 10;

    // Leaderboard based on closed deals revenue per user
    const results = await Deal.findAll({
      where: { ...dateWhere, stage: DealStageEnums.CLOSED },
      attributes: [
        [fn('SUM', col('Deal.price')), 'totalRevenue'],
        [fn('COUNT', col('Deal.id')), 'dealCount']
      ],
      include: [
        {
          model: User,
          as: 'users',
          attributes: ['id', 'name'],
          through: { attributes: [] }
        }
      ],
      group: ['users.id', 'users.name'],
      order: [[literal('"totalRevenue"'), 'DESC']],
      limit,
      raw: false
    });

    const leaderboard = results
      .map(r => {
        const userData = r.users?.[0];
        return {
          userId: userData?.id,
          userName: userData?.name,
          totalRevenue: Number(r.getDataValue('totalRevenue') || 0),
          dealCount: Number(r.getDataValue('dealCount') || 0)
        };
      })
      .filter(entry => entry.userId);

    return { leaderboard };
  }

  // ─── PREDEFINED ANALYTICS ENDPOINTS ───────────────────
  async getExecutiveSummary(tenantId?: string | null) {
    const cacheKey = `dashboard:executive_summary:${tenantId || 'global'}`;
    return cacheService.getOrSet(
      cacheKey,
      async () => {
        return this._computeExecutiveSummary(tenantId);
      },
      DASHBOARD_CACHE_TTL
    );
  }

  private async _computeExecutiveSummary(tenantId?: string | null) {
    const tenantFilter = tenantId ? { tenantId } : {};
    const [totalRevenueResult, activeDealsCount, totalLeads, convertedLeads, pendingTasks, overdueProjects] = await Promise.all([
      Deal.findOne({
        where: { stage: DealStageEnums.CLOSED, ...tenantFilter },
        attributes: [[fn('SUM', col('price')), 'totalRevenue']],
        raw: true
      }),
      Deal.count({
        where: { stage: DealStageEnums.PROGRESS, ...tenantFilter }
      }),
      Lead.count({ where: { ...tenantFilter } }),
      Lead.count({
        where: { status: LeadStatusEnums.CONVERTED, ...tenantFilter }
      }),
      DailyTask.count({
        where: {
          status: {
            [Op.notIn]: [DailyTaskStatusEnum.COMPLETED]
          },
          ...tenantFilter
        }
      }),
      Project.count({
        where: {
          status: ProjectStatusEnum.ACTIVE,
          endDate: { [Op.lt]: new Date() },
          ...tenantFilter
        }
      })
    ]);

    const totalRevenue = Number((totalRevenueResult as any)?.totalRevenue || 0);
    const conversionRate = totalLeads > 0 ? Number(((convertedLeads / totalLeads) * 100).toFixed(2)) : 0;

    return {
      totalRevenue,
      activeDeals: activeDealsCount,
      conversionRate,
      pendingTasks,
      overdueItems: overdueProjects
    };
  }

  async getSalesPipelineData(dateRange?: string) {
    const cacheKey = `dashboard:sales_pipeline:${dateRange || 'all'}`;
    return cacheService.getOrSet(
      cacheKey,
      async () => {
        return this._computeSalesPipelineData(dateRange);
      },
      DASHBOARD_CACHE_TTL
    );
  }

  private async _computeSalesPipelineData(dateRange?: string) {
    const dateWhere = buildDateRangeWhere(dateRange);

    const stageResults = await Deal.findAll({
      where: dateWhere,
      attributes: ['stage', [fn('COUNT', col('id')), 'count'], [fn('SUM', col('price')), 'totalValue']],
      group: ['stage'],
      raw: true
    });

    const stages = Object.values(DealStageEnums).map(stage => {
      const found = stageResults.find(r => r.stage === stage);
      return {
        stage,
        count: found ? Number((found as any).count) : 0,
        totalValue: found ? Number((found as any).totalValue || 0) : 0
      };
    });

    return { stages };
  }

  async getRevenueChart(period: string = 'monthly', dateRange?: string) {
    const cacheKey = `dashboard:revenue_chart:${period}:${dateRange || 'all'}`;
    return cacheService.getOrSet(
      cacheKey,
      async () => {
        return this._computeRevenueChart(period, dateRange);
      },
      DASHBOARD_CACHE_TTL
    );
  }

  private async _computeRevenueChart(period: string = 'monthly', dateRange?: string) {
    const dateWhere = buildDateRangeWhere(dateRange);

    let truncUnit: string;
    switch (period) {
      case 'daily':
        truncUnit = 'day';
        break;
      case 'weekly':
        truncUnit = 'week';
        break;
      case 'monthly':
      default:
        truncUnit = 'month';
        break;
    }

    const results = await Deal.findAll({
      where: {
        ...dateWhere,
        stage: DealStageEnums.CLOSED
      },
      attributes: [
        [fn('DATE_TRUNC', truncUnit, col('Deal.createdAt')), 'period'],
        [fn('SUM', col('Deal.price')), 'revenue'],
        [fn('COUNT', col('Deal.id')), 'dealCount']
      ],
      group: [fn('DATE_TRUNC', truncUnit, col('Deal.createdAt'))],
      order: [[fn('DATE_TRUNC', truncUnit, col('Deal.createdAt')), 'ASC']],
      raw: true
    });

    return {
      labels: results.map(r => (r as any).period),
      revenue: results.map(r => Number((r as any).revenue || 0)),
      dealCount: results.map(r => Number((r as any).dealCount || 0))
    };
  }

  async getActivitySummary(userId?: number, dateRange?: string) {
    const cacheKey = `dashboard:activity_summary:${userId || 'all'}:${dateRange || 'all'}`;
    return cacheService.getOrSet(
      cacheKey,
      async () => {
        return this._computeActivitySummary(userId, dateRange);
      },
      DASHBOARD_CACHE_TTL
    );
  }

  private async _computeActivitySummary(userId?: number, dateRange?: string) {
    const dateWhere = buildDateRangeWhere(dateRange);
    const userFilter = userId ? { userId } : {};

    const [newLeads, newOpportunities, newDeals, closedDeals, completedTasks] = await Promise.all([
      Lead.count({ where: dateWhere }),
      Opportunity.count({ where: dateWhere }),
      Deal.count({ where: dateWhere }),
      Deal.count({ where: { ...dateWhere, stage: DealStageEnums.CLOSED } }),
      DailyTask.count({
        where: {
          ...dateWhere,
          ...userFilter,
          status: DailyTaskStatusEnum.COMPLETED
        }
      })
    ]);

    return {
      newLeads,
      newOpportunities,
      newDeals,
      closedDeals,
      completedTasks
    };
  }

  async getTeamPerformance(dateRange?: string) {
    const dateWhere = buildDateRangeWhere(dateRange);

    // Get all active users
    const users = await User.findAll({
      where: { status: 'ACTIVE' },
      attributes: ['id', 'name'],
      raw: true
    });

    const performance = await Promise.all(
      users.map(async (user: any) => {
        const [dealsWon, dealRevenue, leadsCreated, tasksCompleted] = await Promise.all([
          Deal.count({
            where: { ...dateWhere, stage: DealStageEnums.CLOSED },
            include: [
              {
                model: User,
                as: 'users',
                where: { id: user.id },
                through: { attributes: [] },
                required: true
              }
            ]
          }),
          Deal.findOne({
            where: { ...dateWhere, stage: DealStageEnums.CLOSED },
            attributes: [[fn('SUM', col('Deal.price')), 'revenue']],
            include: [
              {
                model: User,
                as: 'users',
                where: { id: user.id },
                attributes: [],
                through: { attributes: [] },
                required: true
              }
            ],
            raw: true,
            subQuery: false
          }),
          Lead.count({
            where: dateWhere,
            include: [
              {
                model: User,
                as: 'users',
                where: { id: user.id },
                through: { attributes: [] },
                required: true
              }
            ]
          }),
          DailyTask.count({
            where: {
              ...dateWhere,
              salesRepresentativeId: user.id,
              status: DailyTaskStatusEnum.COMPLETED
            }
          })
        ]);

        return {
          userId: user.id,
          userName: user.name,
          dealsWon,
          revenue: Number((dealRevenue as any)?.revenue || 0),
          leadsCreated,
          tasksCompleted
        };
      })
    );

    // Sort by revenue descending
    performance.sort((a, b) => b.revenue - a.revenue);

    return { team: performance };
  }

  // ─── ANALYTICS PAGE ENDPOINTS ──────────────────────────

  async getAnalyticsSummary(startDate?: string, endDate?: string) {
    const dateWhere: Record<string, unknown> = {};
    if (startDate && endDate) {
      dateWhere.createdAt = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    }

    const [totalLeads, totalDeals, revenueResult, wonDeals, lostDeals, avgCycleResult] = await Promise.all([
      Lead.count({ where: dateWhere }),
      Deal.count({ where: dateWhere }),
      Deal.findOne({
        where: { ...dateWhere, stage: DealStageEnums.CLOSED },
        attributes: [[fn('SUM', col('price')), 'totalRevenue']],
        raw: true
      }),
      Deal.count({ where: { ...dateWhere, stage: DealStageEnums.CLOSED } }),
      Deal.count({ where: { ...dateWhere, stage: DealStageEnums.CANCELLED } }),
      Deal.findOne({
        where: { ...dateWhere, stage: DealStageEnums.CLOSED },
        attributes: [[fn('AVG', literal(`EXTRACT(EPOCH FROM ("updatedAt" - "createdAt")) / 86400`)), 'avgCycle']],
        raw: true
      })
    ]);

    const totalClosedCancelled = wonDeals + lostDeals;
    const winRate = totalClosedCancelled > 0 ? (wonDeals / totalClosedCancelled) * 100 : 0;
    const totalRevenue = Number((revenueResult as any)?.totalRevenue || 0);
    const avgDealCycle = Math.round(Number((avgCycleResult as any)?.avgCycle || 0));

    return { totalLeads, totalDeals, totalRevenue, winRate, avgDealCycle };
  }

  async getLeadSources(startDate?: string, endDate?: string) {
    const dateWhere: Record<string, unknown> = {};
    if (startDate && endDate) {
      dateWhere.createdAt = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    }

    const results = await Lead.findAll({
      where: dateWhere,
      attributes: ['leadSource', [fn('COUNT', col('id')), 'count']],
      group: ['leadSource'],
      raw: true
    });

    return results.map(r => ({
      source: r.leadSource,
      count: Number((r as any).count)
    }));
  }

  async getWinLoss(startDate?: string, endDate?: string) {
    const dateWhere: Record<string, unknown> = {};
    if (startDate && endDate) {
      dateWhere.createdAt = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    }

    const [won, lost] = await Promise.all([
      Deal.count({ where: { ...dateWhere, stage: DealStageEnums.CLOSED } }),
      Deal.count({ where: { ...dateWhere, stage: DealStageEnums.CANCELLED } })
    ]);

    return { won, lost };
  }

  async getAvgDealSize(startDate?: string, endDate?: string) {
    const dateWhere: Record<string, unknown> = {};
    if (startDate && endDate) {
      dateWhere.createdAt = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    }

    const results = await Deal.findAll({
      where: { ...dateWhere, stage: DealStageEnums.CLOSED },
      attributes: [
        [literal(`TO_CHAR("createdAt", 'YYYY-MM')`), 'month'],
        [fn('AVG', col('price')), 'avgValue'],
        [fn('COUNT', col('id')), 'dealCount']
      ],
      group: [literal(`TO_CHAR("createdAt", 'YYYY-MM')`) as any],
      order: [[literal(`TO_CHAR("createdAt", 'YYYY-MM')`), 'ASC']],
      raw: true
    });

    return results.map(r => ({
      month: (r as any).month,
      avgValue: Math.round(Number((r as any).avgValue || 0)),
      dealCount: Number((r as any).dealCount)
    }));
  }

  async getConversionFunnel(startDate?: string, endDate?: string) {
    const dateWhere: Record<string, unknown> = {};
    if (startDate && endDate) {
      dateWhere.createdAt = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    }

    const funnelStages = [
      { name: 'New Leads', model: Lead, where: dateWhere },
      { name: 'Contacted', model: Lead, where: { ...dateWhere, status: LeadStatusEnums.CONTACTED } },
      { name: 'Qualified', model: Lead, where: { ...dateWhere, status: LeadStatusEnums.QUALIFIED } },
      { name: 'Converted', model: Lead, where: { ...dateWhere, status: LeadStatusEnums.CONVERTED } },
      { name: 'Deals Won', model: Deal, where: { ...dateWhere, stage: DealStageEnums.CLOSED } }
    ];

    const results = await Promise.all(
      funnelStages.map(async stage => ({
        name: stage.name,
        value: await (stage.model as any).count({ where: stage.where })
      }))
    );

    return results;
  }
}

export default new DashboardService();
