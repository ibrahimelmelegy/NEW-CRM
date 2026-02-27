import { Op } from 'sequelize';
import VendorScorecard from './vendorScorecardModel';
import Vendor from '../vendor/vendorModel';
import { clampPagination } from '../utils/pagination';

class VendorScorecardService {
  async create(data: any, tenantId?: string) {
    const scores = [data.qualityScore, data.deliveryScore, data.priceScore, data.communicationScore].filter(Boolean);
    if (scores.length > 0) {
      data.overallScore = Number((scores.reduce((a: number, b: number) => a + b, 0) / scores.length).toFixed(1));
    }
    return VendorScorecard.create({ ...data, tenantId });
  }

  async getAll(query: any, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.vendorId) where.vendorId = query.vendorId;
    if (query.period) where.period = query.period;
    const { rows, count } = await VendorScorecard.findAndCountAll({
      where,
      include: [{ model: Vendor, as: 'vendor', attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']], limit, offset, distinct: true
    });
    return { docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
  }

  async update(id: number, data: any) {
    const item = await VendorScorecard.findByPk(id);
    if (!item) return null;
    const scores = [data.qualityScore ?? item.qualityScore, data.deliveryScore ?? item.deliveryScore, data.priceScore ?? item.priceScore, data.communicationScore ?? item.communicationScore].filter(Boolean);
    if (scores.length > 0) data.overallScore = Number((scores.reduce((a: number, b: number) => a + b, 0) / scores.length).toFixed(1));
    await item.update(data);
    return item;
  }

  async delete(id: number) {
    const item = await VendorScorecard.findByPk(id);
    if (!item) return false;
    await item.destroy();
    return true;
  }
}
export default new VendorScorecardService();
