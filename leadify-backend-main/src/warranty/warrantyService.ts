import { Op } from 'sequelize';
import { Warranty, WarrantyClaim } from './warrantyModel';
import Client from '../client/clientModel';
import { clampPagination } from '../utils/pagination';

class WarrantyService {
  async createWarranty(data: any, tenantId?: string) { return Warranty.create({ ...data, tenantId }); }

  async getWarranties(query: any, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;
    if (query.search) where.productName = { [Op.iLike]: `%${query.search}%` };
    const { rows, count } = await Warranty.findAndCountAll({
      where,
      include: [
        { model: Client, as: 'client', attributes: ['id', 'name', 'email'] },
        { model: WarrantyClaim, as: 'claims' }
      ],
      order: [['createdAt', 'DESC']], limit, offset, distinct: true
    });
    return { docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
  }

  async updateWarranty(id: number, data: any) {
    const item = await Warranty.findByPk(id);
    if (!item) return null;
    await item.update(data);
    return item;
  }

  async deleteWarranty(id: number) {
    await WarrantyClaim.destroy({ where: { warrantyId: id } });
    const item = await Warranty.findByPk(id);
    if (!item) return false;
    await item.destroy();
    return true;
  }

  async createClaim(data: any, tenantId?: string) { return WarrantyClaim.create({ ...data, tenantId }); }

  async getClaims(query: any, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.warrantyId) where.warrantyId = query.warrantyId;
    if (query.status) where.status = query.status;
    const { rows, count } = await WarrantyClaim.findAndCountAll({
      where,
      include: [{ model: Warranty, as: 'warranty', attributes: ['id', 'productName', 'serialNumber'] }],
      order: [['createdAt', 'DESC']], limit, offset, distinct: true
    });
    return { docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
  }

  async updateClaim(id: number, data: any) {
    const claim = await WarrantyClaim.findByPk(id);
    if (!claim) return null;
    if (data.status === 'RESOLVED' && !claim.resolvedAt) data.resolvedAt = new Date();
    await claim.update(data);
    return claim;
  }
}
export default new WarrantyService();
