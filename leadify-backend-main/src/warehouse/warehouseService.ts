import { Op } from 'sequelize';
import { Warehouse, WarehouseZone, StockTransfer } from './warehouseModel';
import { clampPagination } from '../utils/pagination';

class WarehouseService {
  async createWarehouse(data: any, tenantId?: string) { return Warehouse.create({ ...data, tenantId }); }

  async getWarehouses(query: any, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.status) where.status = query.status;
    if (query.search) where.name = { [Op.iLike]: `%${query.search}%` };
    const { rows, count } = await Warehouse.findAndCountAll({
      where,
      include: [{ model: WarehouseZone, as: 'zones' }],
      order: [['createdAt', 'DESC']], limit, offset, distinct: true
    });
    return { docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
  }

  async updateWarehouse(id: number, data: any) {
    const item = await Warehouse.findByPk(id);
    if (!item) return null;
    await item.update(data);
    return item;
  }

  async deleteWarehouse(id: number) {
    const item = await Warehouse.findByPk(id);
    if (!item) return false;
    await WarehouseZone.destroy({ where: { warehouseId: id } });
    await item.destroy();
    return true;
  }

  async createZone(data: any, tenantId?: string) { return WarehouseZone.create({ ...data, tenantId }); }

  async deleteZone(id: number) {
    const zone = await WarehouseZone.findByPk(id);
    if (!zone) return false;
    await zone.destroy();
    return true;
  }

  async createTransfer(data: any, tenantId?: string) {
    const transferNumber = `TRF-${Date.now().toString(36).toUpperCase()}`;
    return StockTransfer.create({ ...data, transferNumber, tenantId });
  }

  async getTransfers(query: any, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.status) where.status = query.status;
    const { rows, count } = await StockTransfer.findAndCountAll({
      where, order: [['createdAt', 'DESC']], limit, offset
    });
    return { docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
  }

  async updateTransfer(id: number, data: any) {
    const transfer = await StockTransfer.findByPk(id);
    if (!transfer) return null;
    await transfer.update(data);
    return transfer;
  }
}
export default new WarehouseService();
