import { Op, fn, col, literal } from 'sequelize';
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

    const where: any = {};
    if (config.filters) {
      for (const filter of config.filters) {
        const { field, operator, value } = filter;
        switch (operator) {
          case 'equals': where[field] = value; break;
          case 'contains': where[field] = { [Op.iLike]: `%${value}%` }; break;
          case 'greaterThan': where[field] = { [Op.gt]: value }; break;
          case 'lessThan': where[field] = { [Op.lt]: value }; break;
          case 'between':
            where[field] = { [Op.between]: [value[0], value[1]] };
            break;
          case 'in': where[field] = { [Op.in]: value }; break;
        }
      }
    }

    const queryOptions: any = {
      where,
      attributes: config.columns || undefined,
      order: config.sortBy ? [[config.sortBy, config.sortOrder || 'ASC']] : [['createdAt', 'DESC']],
      limit: 1000,
      raw: true
    };

    if (config.groupBy) {
      queryOptions.attributes = [
        config.groupBy,
        [fn('COUNT', col('id')), 'count']
      ];
      queryOptions.group = [config.groupBy];
      delete queryOptions.limit;
    }

    const data = await Model.findAll(queryOptions);
    return data;
  }

  async exportCSV(config: any): Promise<string> {
    const data = await this.executeReport(config);
    if (!data.length) return '';

    const headers = Object.keys(data[0]);
    const rows = data.map((row: any) => headers.map(h => {
      const val = row[h];
      if (val === null || val === undefined) return '';
      const str = String(val);
      return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
    }).join(','));

    return [headers.join(','), ...rows].join('\n');
  }
}

export default new ReportService();
