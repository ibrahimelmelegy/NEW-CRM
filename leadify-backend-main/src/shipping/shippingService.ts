import { Op } from 'sequelize';
import { Shipment, ShippingRate } from './shippingModel';
import { clampPagination } from '../utils/pagination';

class ShippingService {
  async createShipment(data: any, tenantId?: string) {
    const shipmentNumber = `SHP-${Date.now().toString(36).toUpperCase()}`;
    return Shipment.create({ ...data, shipmentNumber, tenantId });
  }

  async getShipments(query: any, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.status) where.status = query.status;
    if (query.carrier) where.carrier = query.carrier;
    if (query.search) where[Op.or] = [
      { shipmentNumber: { [Op.iLike]: `%${query.search}%` } },
      { trackingNumber: { [Op.iLike]: `%${query.search}%` } },
      { recipientName: { [Op.iLike]: `%${query.search}%` } }
    ];
    const { rows, count } = await Shipment.findAndCountAll({ where, order: [['createdAt', 'DESC']], limit, offset });
    return { docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
  }

  async updateShipment(id: number, data: any) {
    const item = await Shipment.findByPk(id);
    if (!item) return null;
    if (data.status === 'DELIVERED' && !item.actualDelivery) data.actualDelivery = new Date();
    await item.update(data);
    return item;
  }

  async deleteShipment(id: number) {
    const item = await Shipment.findByPk(id);
    if (!item) return false;
    await item.destroy();
    return true;
  }

  async createRate(data: any, tenantId?: string) { return ShippingRate.create({ ...data, tenantId }); }

  async getRates(query: any, tenantId?: string) {
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.carrier) where.carrier = query.carrier;
    if (query.isActive !== undefined) where.isActive = query.isActive === 'true';
    return ShippingRate.findAll({ where, order: [['carrier', 'ASC'], ['weightMin', 'ASC']] });
  }

  async updateRate(id: number, data: any) {
    const item = await ShippingRate.findByPk(id);
    if (!item) return null;
    await item.update(data);
    return item;
  }

  async deleteRate(id: number) {
    const item = await ShippingRate.findByPk(id);
    if (!item) return false;
    await item.destroy();
    return true;
  }
}
export default new ShippingService();
