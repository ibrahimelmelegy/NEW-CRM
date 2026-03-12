import { Op, fn, col } from 'sequelize';
import CustomReport, { ReportFilter, ReportSchedule } from './customReportModel';
import Lead from '../lead/leadModel';
import Deal from '../deal/model/dealModel';
import Client from '../client/clientModel';
import Opportunity from '../opportunity/opportunityModel';
import SalesOrder from '../salesOrder/models/salesOrderModel';
import Invoice from '../deal/model/invoiceMode';
import Payment from '../payment/models/paymentModel';
import Ticket from '../support/models/ticketModel';
import Employee from '../hr/models/employeeModel';
import BaseError from '../utils/error/base-http-exception';
import { ERRORS } from '../utils/error/errors';
import reportPdfService from './pdfService';

// ─── Field Type Definitions ─────────────────────────────────

export interface FieldDefinition {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select';
  icon: string;
  options?: string[];
}

export interface ModuleDefinition {
  key: string;
  label: string;
  icon: string;
  fields: FieldDefinition[];
}

export interface ReportBuilderConfig {
  modules: string[];
  fields: string[];
  filters: ReportFilter[];
  groupBy?: string;
  aggregations?: { field: string; function: 'COUNT' | 'SUM' | 'AVG' | 'MIN' | 'MAX' }[];
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  limit?: number;
  offset?: number;
}

// ─── Module Field Definitions ────────────────────────────────

const MODULE_FIELDS: Record<string, ModuleDefinition> = {
  leads: {
    key: 'leads',
    label: 'Leads',
    icon: 'ph:user-plus',
    fields: [
      { name: 'name', label: 'Name', type: 'text', icon: 'ph:user' },
      { name: 'email', label: 'Email', type: 'text', icon: 'ph:envelope' },
      { name: 'phone', label: 'Phone', type: 'text', icon: 'ph:phone' },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        icon: 'ph:flag',
        options: ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']
      },
      {
        name: 'leadSource',
        label: 'Source',
        type: 'select',
        icon: 'ph:globe',
        options: ['EMAIL', 'WEBSITE', 'REFERRAL', 'SOCIAL_MEDIA', 'COLD_CALL', 'EVENT', 'OTHER']
      },
      { name: 'companyName', label: 'Company', type: 'text', icon: 'ph:buildings' },
      { name: 'score', label: 'Score', type: 'number', icon: 'ph:star' },
      { name: 'createdAt', label: 'Created At', type: 'date', icon: 'ph:calendar' }
    ]
  },
  deals: {
    key: 'deals',
    label: 'Deals',
    icon: 'ph:handshake',
    fields: [
      { name: 'name', label: 'Name', type: 'text', icon: 'ph:tag' },
      { name: 'price', label: 'Price', type: 'number', icon: 'ph:currency-dollar' },
      {
        name: 'stage',
        label: 'Stage',
        type: 'select',
        icon: 'ph:funnel',
        options: ['QUALIFYING', 'MEETING', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST']
      },
      {
        name: 'contractType',
        label: 'Contract Type',
        type: 'select',
        icon: 'ph:file-text',
        options: ['SERVICE', 'PRODUCT', 'SUBSCRIPTION', 'MAINTENANCE']
      },
      { name: 'signatureDate', label: 'Signature Date', type: 'date', icon: 'ph:pen' },
      { name: 'createdAt', label: 'Created At', type: 'date', icon: 'ph:calendar' }
    ]
  },
  clients: {
    key: 'clients',
    label: 'Clients',
    icon: 'ph:address-book',
    fields: [
      { name: 'clientName', label: 'Client Name', type: 'text', icon: 'ph:user' },
      { name: 'email', label: 'Email', type: 'text', icon: 'ph:envelope' },
      { name: 'phoneNumber', label: 'Phone', type: 'text', icon: 'ph:phone' },
      { name: 'companyName', label: 'Company', type: 'text', icon: 'ph:buildings' },
      {
        name: 'industry',
        label: 'Industry',
        type: 'select',
        icon: 'ph:factory',
        options: ['TECHNOLOGY', 'HEALTHCARE', 'FINANCE', 'RETAIL', 'MANUFACTURING', 'EDUCATION', 'OTHER']
      },
      { name: 'clientStatus', label: 'Status', type: 'select', icon: 'ph:flag', options: ['ACTIVE', 'INACTIVE', 'PROSPECT'] },
      { name: 'createdAt', label: 'Created At', type: 'date', icon: 'ph:calendar' }
    ]
  },
  salesOrders: {
    key: 'salesOrders',
    label: 'Sales Orders',
    icon: 'ph:shopping-cart',
    fields: [
      { name: 'orderNumber', label: 'Order Number', type: 'text', icon: 'ph:hash' },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        icon: 'ph:flag',
        options: ['DRAFT', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']
      },
      { name: 'total', label: 'Total Amount', type: 'number', icon: 'ph:currency-dollar' },
      { name: 'subtotal', label: 'Subtotal', type: 'number', icon: 'ph:currency-dollar' },
      { name: 'taxAmount', label: 'Tax Amount', type: 'number', icon: 'ph:receipt' },
      { name: 'currency', label: 'Currency', type: 'text', icon: 'ph:money' },
      { name: 'createdAt', label: 'Created At', type: 'date', icon: 'ph:calendar' }
    ]
  },
  invoices: {
    key: 'invoices',
    label: 'Invoices',
    icon: 'ph:invoice',
    fields: [
      { name: 'invoiceNumber', label: 'Invoice Number', type: 'text', icon: 'ph:hash' },
      { name: 'amount', label: 'Amount', type: 'number', icon: 'ph:currency-dollar' },
      { name: 'collected', label: 'Collected', type: 'select', icon: 'ph:check-circle', options: ['true', 'false'] },
      { name: 'invoiceDate', label: 'Invoice Date', type: 'date', icon: 'ph:calendar' },
      { name: 'collectedDate', label: 'Collected Date', type: 'date', icon: 'ph:calendar-check' },
      { name: 'createdAt', label: 'Created At', type: 'date', icon: 'ph:calendar' }
    ]
  },
  payments: {
    key: 'payments',
    label: 'Payments',
    icon: 'ph:credit-card',
    fields: [
      { name: 'paymentNumber', label: 'Payment Number', type: 'text', icon: 'ph:hash' },
      { name: 'amount', label: 'Amount', type: 'number', icon: 'ph:currency-dollar' },
      { name: 'method', label: 'Method', type: 'select', icon: 'ph:wallet', options: ['CASH', 'BANK_TRANSFER', 'CREDIT_CARD', 'CHECK', 'ONLINE'] },
      { name: 'status', label: 'Status', type: 'select', icon: 'ph:flag', options: ['COMPLETED', 'PENDING', 'FAILED', 'VOIDED'] },
      { name: 'date', label: 'Date', type: 'date', icon: 'ph:calendar' },
      { name: 'reference', label: 'Reference', type: 'text', icon: 'ph:link' },
      { name: 'createdAt', label: 'Created At', type: 'date', icon: 'ph:calendar' }
    ]
  },
  tickets: {
    key: 'tickets',
    label: 'Tickets',
    icon: 'ph:ticket',
    fields: [
      { name: 'ticketNumber', label: 'Ticket Number', type: 'text', icon: 'ph:hash' },
      { name: 'subject', label: 'Subject', type: 'text', icon: 'ph:text-aa' },
      { name: 'priority', label: 'Priority', type: 'select', icon: 'ph:warning', options: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        icon: 'ph:flag',
        options: ['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED']
      },
      { name: 'source', label: 'Source', type: 'select', icon: 'ph:globe', options: ['EMAIL', 'PORTAL', 'PHONE', 'CHAT'] },
      { name: 'createdAt', label: 'Created At', type: 'date', icon: 'ph:calendar' }
    ]
  },
  employees: {
    key: 'employees',
    label: 'Employees',
    icon: 'ph:identification-badge',
    fields: [
      { name: 'employeeNumber', label: 'Employee Number', type: 'text', icon: 'ph:hash' },
      { name: 'firstName', label: 'First Name', type: 'text', icon: 'ph:user' },
      { name: 'lastName', label: 'Last Name', type: 'text', icon: 'ph:user' },
      { name: 'email', label: 'Email', type: 'text', icon: 'ph:envelope' },
      { name: 'jobTitle', label: 'Position', type: 'text', icon: 'ph:briefcase' },
      {
        name: 'employmentType',
        label: 'Employment Type',
        type: 'select',
        icon: 'ph:clock',
        options: ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN']
      },
      { name: 'status', label: 'Status', type: 'select', icon: 'ph:flag', options: ['ACTIVE', 'ON_LEAVE', 'TERMINATED', 'PROBATION'] },
      { name: 'salary', label: 'Salary', type: 'number', icon: 'ph:currency-dollar' },
      { name: 'hireDate', label: 'Hire Date', type: 'date', icon: 'ph:calendar' },
      { name: 'createdAt', label: 'Created At', type: 'date', icon: 'ph:calendar' }
    ]
  }
};

// ─── Entity Model Mapping ────────────────────────────────────

const moduleModelMap: Record<string, any> = {
  leads: Lead,
  deals: Deal,
  clients: Client,
  opportunities: Opportunity,
  salesOrders: SalesOrder,
  invoices: Invoice,
  payments: Payment,
  tickets: Ticket,
  employees: Employee
};

// ─── Service Class ───────────────────────────────────────────

class ReportBuilderService {
  /**
   * Return available field definitions for a module
   */
  getModuleFields(moduleKey: string): ModuleDefinition | null {
    return MODULE_FIELDS[moduleKey] || null;
  }

  /**
   * Return all available modules with their field definitions
   */
  getAllModuleFields(): Record<string, ModuleDefinition> {
    return MODULE_FIELDS;
  }

  /**
   * Build a dynamic Sequelize query from a report configuration
   */
  buildDynamicQuery(config: ReportBuilderConfig) {
    const moduleKey = config.modules[0];
    const Model = moduleModelMap[moduleKey];
    if (!Model) {
      throw new BaseError(ERRORS.SOMETHING_WENT_WRONG);
    }

    const where = this.buildWhereClause(config.filters);
    const queryOptions: Record<string, any> = {
      where,
      raw: true,
      limit: config.limit || 5000,
      offset: config.offset || 0
    };

    if (config.groupBy) {
      const aggAttributes = this.buildAggregationAttributes(config.aggregations || []);
      // Always include count when grouping
      if (!aggAttributes.some(a => a[1]?.startsWith('count_'))) {
        aggAttributes.push([fn('COUNT', col(config.groupBy)), 'count']);
      }
      queryOptions.attributes = [config.groupBy, ...aggAttributes];
      queryOptions.group = [config.groupBy];
      delete queryOptions.limit;
      delete queryOptions.offset;
    } else {
      if (config.fields && config.fields.length > 0) {
        queryOptions.attributes = config.fields;
      }
    }

    if (config.sortBy) {
      queryOptions.order = [[config.sortBy, config.sortOrder || 'DESC']];
    } else if (!config.groupBy) {
      queryOptions.order = [['createdAt', 'DESC']];
    }

    return { Model, queryOptions };
  }

  /**
   * Execute a dynamic report query and return results with metadata
   */
  async executeReport(config: ReportBuilderConfig, _userId: number) {
    const { Model, queryOptions } = this.buildDynamicQuery(config);

    const data = await Model.findAll(queryOptions);
    const totalCount = await Model.count({ where: queryOptions.where });

    // Compute summary statistics for numeric fields
    const summary = this.computeSummary(data, config);

    return {
      data,
      totalCount,
      groupBy: config.groupBy || null,
      modules: config.modules,
      summary
    };
  }

  /**
   * Compute summary statistics (totals, averages) for numeric columns
   */
  private computeSummary(data: Record<string, any>[], config: ReportBuilderConfig) {
    if (!data.length) return {};

    const moduleKey = config.modules[0];
    const moduleDef = MODULE_FIELDS[moduleKey];
    if (!moduleDef) return {};

    const numericFields = moduleDef.fields.filter(f => f.type === 'number').map(f => f.name);

    const activeNumericFields = config.fields ? numericFields.filter(f => config.fields.includes(f)) : numericFields;

    const summary: Record<string, { sum: number; avg: number; min: number; max: number; count: number }> = {};

    for (const field of activeNumericFields) {
      const values = data.map(row => Number(row[field])).filter(v => !isNaN(v));

      if (values.length > 0) {
        summary[field] = {
          sum: values.reduce((a, b) => a + b, 0),
          avg: values.reduce((a, b) => a + b, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          count: values.length
        };
      }
    }

    return summary;
  }

  /**
   * Build WHERE clause from filter definitions
   */
  private buildWhereClause(filters: ReportFilter[]): unknown {
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

  /**
   * Build aggregation attributes for grouped queries
   */
  private buildAggregationAttributes(aggregations: { field: string; function: string }[]): unknown[] {
    if (!aggregations || !aggregations.length) return [];

    return aggregations.map(agg => {
      const alias = `${agg.function.toLowerCase()}_${agg.field}`;
      switch (agg.function) {
        case 'COUNT':
          return [fn('COUNT', col(agg.field)), alias];
        case 'SUM':
          return [fn('SUM', col(agg.field)), alias];
        case 'AVG':
          return [fn('AVG', col(agg.field)), alias];
        case 'MIN':
          return [fn('MIN', col(agg.field)), alias];
        case 'MAX':
          return [fn('MAX', col(agg.field)), alias];
        default:
          return [fn('COUNT', col(agg.field)), `count_${agg.field}`];
      }
    });
  }

  /**
   * Save a CRON schedule configuration for a report
   */
  async scheduleReport(reportId: number, schedule: ReportSchedule, userId: number) {
    const report = await CustomReport.findOne({
      where: { id: reportId, userId }
    });
    if (!report) throw new BaseError(ERRORS.REPORT_NOT_FOUND, 404);

    await report.update({ schedule });
    return report;
  }

  /**
   * Generate CSV string from report data
   */
  generateCSV(data: Record<string, any>[], fields?: string[]): string {
    if (!data || !data.length) return '';

    const headers = fields && fields.length > 0 ? fields : Object.keys(data[0]);
    const rows = data.map(row =>
      headers
        .map(h => {
          const val = row[h];
          if (val === null || val === undefined) return '';
          const str = String(val);
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Generate structured data for Excel export
   */
  generateExcelData(data: Record<string, any>[], fields?: string[]) {
    if (!data || !data.length) return { headers: [], rows: [] };

    const headers = fields && fields.length > 0 ? fields : Object.keys(data[0]);
    const rows = data.map(row => headers.map(h => row[h] ?? ''));

    return { headers, rows };
  }

  /**
   * Export a report by executing its config and returning formatted data
   */
  async exportReport(reportId: number, format: string, userId: number) {
    const report = await CustomReport.findByPk(reportId);
    if (!report) throw new BaseError(ERRORS.REPORT_NOT_FOUND, 404);

    const config: ReportBuilderConfig = {
      modules: [this.entityTypeToModule(report.entityType)],
      fields: report.fields,
      filters: report.filters,
      groupBy: report.groupBy || undefined,
      aggregations: report.aggregations,
      sortBy: report.sortBy || undefined,
      sortOrder: report.sortOrder
    };

    const result = await this.executeReport(config, userId);

    if (format === 'csv') {
      return {
        contentType: 'text/csv',
        filename: `report-${report.name.replace(/\s+/g, '-')}.csv`,
        content: this.generateCSV(result.data, report.fields)
      };
    }

    if (format === 'excel') {
      return {
        contentType: 'application/json',
        filename: `report-${report.name.replace(/\s+/g, '-')}.xlsx`,
        content: this.generateExcelData(result.data, report.fields)
      };
    }

    if (format === 'pdf') {
      return {
        contentType: 'application/json',
        filename: `report-${report.name.replace(/\s+/g, '-')}.pdf`,
        content: {
          reportName: report.name,
          description: report.description,
          entityType: report.entityType,
          generatedAt: new Date().toISOString(),
          totalRecords: result.totalCount,
          headers: report.fields,
          data: result.data
        }
      };
    }

    throw new BaseError(ERRORS.SOMETHING_WENT_WRONG);
  }

  /**
   * Generate a PDF buffer from a report configuration.
   * Executes the report query, then renders data into a styled PDF via Puppeteer.
   */
  async generatePdfFromConfig(config: ReportBuilderConfig, userId: number, title?: string): Promise<Buffer> {
    const result = await this.executeReport(config, userId);
    const moduleKey = config.modules[0];
    const moduleDef = MODULE_FIELDS[moduleKey];

    // Build column labels from module field definitions
    const columnLabels: Record<string, string> = {};
    if (moduleDef) {
      for (const field of moduleDef.fields) {
        columnLabels[field.name] = field.label;
      }
    }

    const columns = config.fields && config.fields.length > 0 ? config.fields : result.data.length > 0 ? Object.keys(result.data[0]) : [];

    const reportTitle = title || `${moduleDef?.label || moduleKey} Report`;

    return reportPdfService.generateReportPdf({
      title: reportTitle,
      subtitle: config.groupBy ? `Grouped by ${columnLabels[config.groupBy] || config.groupBy}` : undefined,
      data: result.data,
      columns,
      columnLabels,
      summary: result.summary as Record<string, { sum: number; avg: number; min: number; max: number; count: number }>,
      orientation: columns.length > 5 ? 'landscape' : 'portrait'
    });
  }

  /**
   * Generate a PDF buffer from a saved report ID.
   */
  async generatePdfFromReport(reportId: number, userId: number): Promise<{ buffer: Buffer; filename: string }> {
    const report = await CustomReport.findByPk(reportId);
    if (!report) throw new BaseError(ERRORS.REPORT_NOT_FOUND, 404);

    const config: ReportBuilderConfig = {
      modules: [this.entityTypeToModule(report.entityType)],
      fields: report.fields,
      filters: report.filters,
      groupBy: report.groupBy || undefined,
      aggregations: report.aggregations,
      sortBy: report.sortBy || undefined,
      sortOrder: report.sortOrder
    };

    const buffer = await this.generatePdfFromConfig(config, userId, report.name);
    const filename = `report-${report.name.replace(/\s+/g, '-').toLowerCase()}.pdf`;

    return { buffer, filename };
  }

  /**
   * Map entity type strings to module keys
   */
  private entityTypeToModule(entityType: string): string {
    const map: Record<string, string> = {
      LEAD: 'leads',
      lead: 'leads',
      leads: 'leads',
      DEAL: 'deals',
      deal: 'deals',
      deals: 'deals',
      CLIENT: 'clients',
      client: 'clients',
      clients: 'clients',
      OPPORTUNITY: 'opportunities',
      opportunity: 'opportunities',
      SALES_ORDER: 'salesOrders',
      salesOrders: 'salesOrders',
      INVOICE: 'invoices',
      invoice: 'invoices',
      invoices: 'invoices',
      PAYMENT: 'payments',
      payment: 'payments',
      payments: 'payments',
      TICKET: 'tickets',
      ticket: 'tickets',
      tickets: 'tickets',
      EMPLOYEE: 'employees',
      employee: 'employees',
      employees: 'employees'
    };
    return map[entityType] || entityType;
  }
}

export default new ReportBuilderService();
