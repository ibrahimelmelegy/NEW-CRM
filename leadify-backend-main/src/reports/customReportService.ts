import { Op, fn, col } from 'sequelize';
import CustomReport, { ReportFilter, ReportAggregation } from './customReportModel';
import Lead from '../lead/leadModel';
import Deal from '../deal/model/dealModel';
import Client from '../client/clientModel';
import Opportunity from '../opportunity/opportunityModel';
import Project from '../project/models/projectModel';
import Invoice from '../deal/model/invoiceMode';
import DailyTask from '../dailyTask/dailyTaskModel';
import User from '../user/userModel';
import Contract from '../contract/contractModel';
import Vendor from '../vendor/vendorModel';
import PurchaseOrder from '../procurement/models/purchaseOrderModel';
import Campaign from '../campaign/campaignModel';
import BaseError from '../utils/error/base-http-exception';
import { ERRORS } from '../utils/error/errors';

// ─── Entity Type to Model Mapping ────────────────────────
const entityModelMap: Record<string, any> = {
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
  task: DailyTask,
  user: User,
  users: User,
  contract: Contract,
  contracts: Contract,
  vendor: Vendor,
  vendors: Vendor,
  purchase_order: PurchaseOrder,
  campaign: Campaign,
  campaigns: Campaign
};

function getModelByEntityType(entityType: string): any {
  const model = entityModelMap[entityType?.toLowerCase()];
  if (!model) throw new BaseError(ERRORS.SOMETHING_WENT_WRONG);
  return model;
}

// ─── Entity Type Models List ─────────────────────────────
function getEntityTypeModels(): Record<string, string> {
  return {
    lead: 'Lead',
    deal: 'Deal',
    client: 'Client',
    opportunity: 'Opportunity',
    project: 'Project',
    invoice: 'Invoice',
    daily_task: 'Daily Task',
    user: 'User',
    contract: 'Contract',
    vendor: 'Vendor',
    purchase_order: 'Purchase Order',
    campaign: 'Campaign'
  };
}

// ─── Build Filter WHERE Clause ───────────────────────────
function buildFilterWhere(filters: ReportFilter[]): any {
  if (!filters || !filters.length) return {};

  const where: Record<string, any> = {};
  for (const filter of filters) {
    const { field, operator, value } = filter;
    switch (operator) {
      case 'equals':
        where[field] = value;
        break;
      case 'not_equals':
        where[field] = { [Op.ne]: value };
        break;
      case 'contains':
        where[field] = { [Op.iLike]: `%${value}%` };
        break;
      case 'greater_than':
        where[field] = { [Op.gt]: value };
        break;
      case 'less_than':
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

// ─── Build Aggregation Attributes ────────────────────────
function buildAggregationAttributes(aggregations: ReportAggregation[]): any[] {
  if (!aggregations || !aggregations.length) return [];

  return aggregations.map(agg => {
    switch (agg.function) {
      case 'COUNT':
        return [fn('COUNT', col(agg.field)), `${agg.function.toLowerCase()}_${agg.field}`];
      case 'SUM':
        return [fn('SUM', col(agg.field)), `${agg.function.toLowerCase()}_${agg.field}`];
      case 'AVG':
        return [fn('AVG', col(agg.field)), `${agg.function.toLowerCase()}_${agg.field}`];
      case 'MIN':
        return [fn('MIN', col(agg.field)), `${agg.function.toLowerCase()}_${agg.field}`];
      case 'MAX':
        return [fn('MAX', col(agg.field)), `${agg.function.toLowerCase()}_${agg.field}`];
      default:
        return [fn('COUNT', col(agg.field)), `count_${agg.field}`];
    }
  });
}

class CustomReportService {
  // ─── CRUD ─────────────────────────────────────────────
  async createReport(data: Record<string, unknown>, userId: number) {
    return CustomReport.create({ ...data, userId });
  }

  async updateReport(id: number, data: Record<string, unknown>, userId: number) {
    const report = await CustomReport.findOne({ where: { id, userId } });
    if (!report) throw new BaseError(ERRORS.REPORT_NOT_FOUND, 404);
    return report.update(data);
  }

  async deleteReport(id: number, userId: number) {
    const report = await CustomReport.findOne({ where: { id, userId } });
    if (!report) throw new BaseError(ERRORS.REPORT_NOT_FOUND, 404);
    await report.destroy();
  }

  async getReports(userId: number, entityType?: string) {
    const where: Record<string, any> = {
      [Op.or]: [{ userId }, { isShared: true }]
    };
    if (entityType) {
      where.entityType = entityType;
    }

    return CustomReport.findAll({
      where,
      order: [['createdAt', 'DESC']],
      include: [{ model: User, attributes: ['id', 'name', 'email'] }]
    });
  }

  async getReportById(id: number) {
    const report = await CustomReport.findByPk(id, {
      include: [{ model: User, attributes: ['id', 'name', 'email'] }]
    });
    if (!report) throw new BaseError(ERRORS.REPORT_NOT_FOUND, 404);
    return report;
  }

  // ─── REPORT EXECUTION ─────────────────────────────────
  async executeReport(id: number, overrideFilters?: ReportFilter[]) {
    const report = await CustomReport.findByPk(id);
    if (!report) throw new BaseError(ERRORS.REPORT_NOT_FOUND, 404);

    const filtersToUse = overrideFilters && overrideFilters.length > 0 ? overrideFilters : report.filters;

    return this.buildAndRunQuery(
      report.entityType,
      report.fields,
      filtersToUse,
      report.groupBy || undefined,
      report.aggregations,
      report.sortBy || undefined,
      report.sortOrder
    );
  }

  async buildAndRunQuery(
    entityType: string,
    fields: string[],
    filters: ReportFilter[],
    groupBy?: string,
    aggregations?: ReportAggregation[],
    sortBy?: string,
    sortOrder: 'ASC' | 'DESC' = 'DESC'
  ) {
    const Model = getModelByEntityType(entityType);
    const where = buildFilterWhere(filters);

    // Build attributes
    const attributes: any = fields && fields.length > 0 ? fields : undefined;

    // Build query options
    const queryOptions: Record<string, any> = {
      where,
      raw: true,
      limit: 5000
    };

    if (groupBy) {
      // Grouped query with aggregations
      const aggAttributes = buildAggregationAttributes(aggregations || []);
      queryOptions.attributes = [groupBy, ...aggAttributes];
      queryOptions.group = [groupBy];
      delete queryOptions.limit; // No limit for grouped queries

      if (sortBy) {
        queryOptions.order = [[sortBy, sortOrder]];
      }
    } else {
      // Non-grouped query
      if (attributes) {
        queryOptions.attributes = attributes;
      }

      if (sortBy) {
        queryOptions.order = [[sortBy, sortOrder]];
      } else {
        queryOptions.order = [['createdAt', sortOrder]];
      }
    }

    const data = await Model.findAll(queryOptions);
    const totalCount = await Model.count({ where });

    return {
      data,
      totalCount,
      groupBy: groupBy || null,
      entityType
    };
  }

  buildReportQuery(report: CustomReport) {
    const Model = getModelByEntityType(report.entityType);
    const where = buildFilterWhere(report.filters);

    const queryOptions: Record<string, any> = {
      where,
      raw: true
    };

    if (report.groupBy) {
      const aggAttributes = buildAggregationAttributes(report.aggregations || []);
      queryOptions.attributes = [report.groupBy, ...aggAttributes];
      queryOptions.group = [report.groupBy];
    } else if (report.fields && report.fields.length > 0) {
      queryOptions.attributes = report.fields;
    }

    if (report.sortBy) {
      queryOptions.order = [[report.sortBy, report.sortOrder || 'DESC']];
    } else {
      queryOptions.order = [['createdAt', report.sortOrder || 'DESC']];
    }

    return { Model, queryOptions };
  }

  // ─── FIELD INTROSPECTION ───────────────────────────────
  getAvailableFields(entityType: string) {
    const Model = getModelByEntityType(entityType);

    const rawAttributes = Model.rawAttributes || Model.getAttributes?.() || {};
    const fields = Object.entries(rawAttributes).map(([name, attr]: [string, any]) => ({
      name,
      type: attr.type?.key || attr.type?.constructor?.name || 'STRING',
      allowNull: attr.allowNull !== false,
      primaryKey: !!attr.primaryKey,
      defaultValue: attr.defaultValue !== undefined ? String(attr.defaultValue) : null
    }));

    return { entityType, fields };
  }

  getEntityTypeModels() {
    return getEntityTypeModels();
  }

  // ─── EXPORT ────────────────────────────────────────────
  async exportReport(id: number, format: string) {
    const report = await CustomReport.findByPk(id);
    if (!report) throw new BaseError(ERRORS.REPORT_NOT_FOUND, 404);

    const result = await this.executeReport(id);

    if (format === 'excel' || format === 'csv') {
      return this.generateCSV(result.data);
    }

    if (format === 'pdf') {
      // Return structured data for PDF generation by the caller
      return {
        reportName: report.name,
        description: report.description,
        entityType: report.entityType,
        generatedAt: new Date().toISOString(),
        totalRecords: result.totalCount,
        data: result.data
      };
    }

    throw new BaseError(ERRORS.SOMETHING_WENT_WRONG);
  }

  private generateCSV(data: Record<string, any>[]): string {
    if (!data || !data.length) return '';

    const headers = Object.keys(data[0]);
    const rows = data.map(row =>
      headers
        .map(h => {
          const val = row[h];
          if (val === null || val === undefined) return '';
          const str = String(val);
          // Escape commas, quotes, and newlines in CSV
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  }
}

export default new CustomReportService();
