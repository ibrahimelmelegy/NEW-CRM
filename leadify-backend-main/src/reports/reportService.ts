import { Op, fn, col, literal } from 'sequelize';
import ExcelJS from 'exceljs';
import SavedReport from './reportModel';
import Lead from '../lead/leadModel';
import Deal from '../deal/model/dealModel';
import Opportunity from '../opportunity/opportunityModel';
import Client from '../client/clientModel';

const modelMap: Record<string, any> = {
  LEAD: Lead,
  DEAL: Deal,
  OPPORTUNITY: Opportunity,
  CLIENT: Client
};

class ReportService {
  async getReports(userId: number) {
    return SavedReport.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });
  }

  async createReport(userId: number, data: any) {
    return SavedReport.create({ ...data, userId });
  }

  async updateReport(id: string, userId: number, data: any) {
    const report = await SavedReport.findOne({ where: { id, userId } });
    if (!report) throw new Error('Report not found');
    return report.update(data);
  }

  async deleteReport(id: string, userId: number) {
    const report = await SavedReport.findOne({ where: { id, userId } });
    if (!report) throw new Error('Report not found');
    await report.destroy();
  }

  async executeReport(config: any) {
    const Model = modelMap[config.entityType];
    if (!Model) throw new Error('Invalid entity type');

    const where: Record<string, any> = {};

    // Handle date range filters
    if (config.startDate || config.endDate) {
      where.createdAt = {};
      if (config.startDate) where.createdAt[Op.gte] = new Date(config.startDate);
      if (config.endDate) where.createdAt[Op.lte] = new Date(config.endDate);
    }

    if (config.filters) {
      for (const filter of config.filters) {
        const { field, operator, value } = filter;
        switch (operator) {
          case 'equals':
            where[field] = value;
            break;
          case 'contains':
            where[field] = { [Op.iLike]: `%${value}%` };
            break;
          case 'greaterThan':
            where[field] = { [Op.gt]: value };
            break;
          case 'lessThan':
            where[field] = { [Op.lt]: value };
            break;
          case 'between':
            where[field] = { [Op.between]: [value[0], value[1]] };
            break;
          case 'in':
            where[field] = { [Op.in]: value };
            break;
        }
      }
    }

    const queryOptions: Record<string, any> = {
      where,
      attributes: config.columns || undefined,
      order: config.sortBy ? [[config.sortBy, config.sortOrder || 'ASC']] : [['createdAt', 'DESC']],
      limit: 1000,
      raw: true
    };

    if (config.groupBy) {
      queryOptions.attributes = [config.groupBy, [fn('COUNT', col('id')), 'count']];
      queryOptions.group = [config.groupBy];
      delete queryOptions.limit;
    }

    const data = await Model.findAll(queryOptions);
    return data;
  }

  async getAnalytics(entityType: string, startDate?: string, endDate?: string) {
    const Model = modelMap[entityType];
    if (!Model) throw new Error('Invalid entity type');

    const where: Record<string, any> = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    // Get totals
    const total = await Model.count({ where });

    // Get by status/stage distribution
    const byStatus = await Model.findAll({
      where,
      attributes: [
        [fn('COALESCE', col('status'), col('stage')), 'status'],
        [fn('COUNT', col('id')), 'count']
      ],
      group: [fn('COALESCE', col('status'), col('stage'))],
      raw: true
    });

    // Get timeline (by month)
    const timeline = await Model.findAll({
      where,
      attributes: [
        [fn('DATE_TRUNC', 'month', col('createdAt')), 'month'],
        [fn('COUNT', col('id')), 'count']
      ],
      group: [fn('DATE_TRUNC', 'month', col('createdAt'))],
      order: [[fn('DATE_TRUNC', 'month', col('createdAt')), 'ASC']],
      raw: true
    });

    // Get value metrics (for deals/opportunities)
    let valueMetrics = null;
    if (entityType === 'DEAL' || entityType === 'OPPORTUNITY') {
      valueMetrics = await Model.findOne({
        where,
        attributes: [
          [fn('SUM', fn('COALESCE', col('price'), col('value'), 0)), 'totalValue'],
          [fn('AVG', fn('COALESCE', col('price'), col('value'), 0)), 'avgValue'],
          [fn('MAX', fn('COALESCE', col('price'), col('value'), 0)), 'maxValue']
        ],
        raw: true
      });
    }

    return {
      total,
      byStatus,
      timeline,
      valueMetrics
    };
  }

  async exportCSV(config: any): Promise<string> {
    const data = await this.executeReport(config);
    if (!data.length) return '';

    const headers = Object.keys(data[0]);
    const rows = data.map((row: any) =>
      headers
        .map(h => {
          const val = row[h];
          if (val === null || val === undefined) return '';
          const str = String(val);
          return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
        })
        .join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  }

  async exportExcel(config: any): Promise<Buffer> {
    const data = await this.executeReport(config);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report');

    if (data.length === 0) {
      worksheet.addRow(['No data available']);
      return Buffer.from(await workbook.xlsx.writeBuffer());
    }

    // Add headers
    const headers = Object.keys(data[0]);
    const headerRow = worksheet.addRow(headers);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF7849FF' }
    };
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Add data rows
    data.forEach((row: any) => {
      const values = headers.map(h => row[h]);
      worksheet.addRow(values);
    });

    // Auto-size columns
    worksheet.columns.forEach((column: any) => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, (cell: any) => {
        const length = cell.value ? String(cell.value).length : 10;
        if (length > maxLength) maxLength = length;
      });
      column.width = Math.min(maxLength + 2, 50);
    });

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }
}

export default new ReportService();
