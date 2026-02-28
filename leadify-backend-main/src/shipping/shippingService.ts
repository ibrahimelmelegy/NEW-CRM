import { Op, fn, col } from 'sequelize';
import { Shipment, ShippingRate } from './shippingModel';
import { clampPagination } from '../utils/pagination';
import { io } from '../server';

/** Valid status progression order */
const STATUS_ORDER: Record<string, string[]> = {
  PREPARING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['IN_TRANSIT', 'CANCELLED'],
  IN_TRANSIT: ['DELIVERED', 'RETURNED', 'CANCELLED'],
  DELIVERED: [],
  RETURNED: [],
  CANCELLED: []
};

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

  // ─── Business Logic ──────────────────────────────────────────────────────────

  /**
   * Calculate shipping rate for a given weight and zone.
   * Looks up active rates whose weight range covers the parcel weight.
   * If zone is specified, filters by zone; otherwise returns all matching rates.
   * Returns the best (cheapest) matching rate.
   */
  async calculateShippingRate(weight: number, zone?: string, tenantId?: string) {
    if (!weight || weight <= 0) throw new Error('Weight must be a positive number');

    const where: any = {
      isActive: true,
      weightMin: { [Op.lte]: weight },
      weightMax: { [Op.gte]: weight }
    };
    if (zone) where.zone = zone;
    if (tenantId) where.tenantId = tenantId;

    const rates = await ShippingRate.findAll({
      where,
      order: [['rate', 'ASC']] // cheapest first
    });

    if (rates.length === 0) {
      return { found: false, message: 'No shipping rate found for the given weight and zone' };
    }

    const best = rates[0];
    return {
      found: true,
      rate: Number(best.rate),
      currency: best.currency,
      carrier: best.carrier,
      zone: best.zone,
      estimatedDays: best.estimatedDays,
      allOptions: rates.map(r => ({
        carrier: r.carrier,
        zone: r.zone,
        rate: Number(r.rate),
        currency: r.currency,
        estimatedDays: r.estimatedDays
      }))
    };
  }

  /**
   * Update shipment status with validation on allowed transitions.
   * Auto-sets timestamps at each stage.
   */
  async updateShipmentStatus(id: number, newStatus: string) {
    const shipment = await Shipment.findByPk(id);
    if (!shipment) throw new Error('Shipment not found');

    const currentStatus = shipment.status;
    const allowedNext = STATUS_ORDER[currentStatus];

    if (!allowedNext) {
      throw new Error(`Unknown current status: ${currentStatus}`);
    }
    if (!allowedNext.includes(newStatus)) {
      throw new Error(
        `Invalid status transition: ${currentStatus} -> ${newStatus}. Allowed: ${allowedNext.join(', ') || 'none (terminal state)'}`
      );
    }

    const updateData: any = { status: newStatus };

    // Auto-set timestamps based on the new status
    if (newStatus === 'SHIPPED') {
      // Shipped — no delivery timestamp yet, but could set a shipped date via notes or extra column
    }
    if (newStatus === 'DELIVERED') {
      if (!shipment.actualDelivery) updateData.actualDelivery = new Date();
    }

    await shipment.update(updateData);
    try { io.emit('shipping:status_changed', { id: shipment.id, shipmentNumber: shipment.shipmentNumber, previousStatus: currentStatus, newStatus }); } catch {}
    if (newStatus === 'DELIVERED') {
      try { io.emit('shipping:delivered', { id: shipment.id, shipmentNumber: shipment.shipmentNumber, recipientName: shipment.recipientName }); } catch {}
    }
    return shipment;
  }

  /**
   * Get the tracking history (status timeline) of a shipment by its tracking number.
   * Since we do not have a separate status history table, return the current shipment
   * with computed delivery metrics.
   */
  async getShipmentTracking(trackingNumber: string) {
    const shipment = await Shipment.findOne({ where: { trackingNumber } });
    if (!shipment) throw new Error('Shipment not found for tracking number: ' + trackingNumber);

    // Compute delivery metrics
    let deliveryDays: number | null = null;
    let onTime: boolean | null = null;
    if (shipment.actualDelivery && shipment.createdAt) {
      const created = new Date(shipment.createdAt as any).getTime();
      const delivered = new Date(shipment.actualDelivery).getTime();
      deliveryDays = Math.ceil((delivered - created) / (1000 * 60 * 60 * 24));
    }
    if (shipment.actualDelivery && shipment.estimatedDelivery) {
      onTime = new Date(shipment.actualDelivery) <= new Date(shipment.estimatedDelivery);
    }

    return {
      shipmentNumber: shipment.shipmentNumber,
      trackingNumber: shipment.trackingNumber,
      status: shipment.status,
      carrier: shipment.carrier,
      origin: shipment.origin,
      destination: shipment.destination,
      recipientName: shipment.recipientName,
      weight: shipment.weight,
      shippingCost: shipment.shippingCost,
      estimatedDelivery: shipment.estimatedDelivery,
      actualDelivery: shipment.actualDelivery,
      deliveryDays,
      onTime,
      createdAt: shipment.createdAt
    };
  }

  /**
   * Get all available carrier rates for a specific weight and zone,
   * grouped by carrier for easy comparison.
   * Returns carriers sorted by cheapest rate first.
   */
  async getCarrierRates(weight: number, zone?: string, tenantId?: string) {
    if (!weight || weight <= 0) throw new Error('Weight must be a positive number');

    const where: any = {
      isActive: true,
      weightMin: { [Op.lte]: weight },
      weightMax: { [Op.gte]: weight }
    };
    if (zone) where.zone = zone;
    if (tenantId) where.tenantId = tenantId;

    const rates = await ShippingRate.findAll({ where, order: [['rate', 'ASC']] });

    // Group by carrier
    const byCarrier: Record<string, Array<{ zone: string | undefined; rate: number; currency: string; estimatedDays: number | undefined }>> = {};
    for (const r of rates) {
      if (!byCarrier[r.carrier]) byCarrier[r.carrier] = [];
      byCarrier[r.carrier].push({
        zone: r.zone,
        rate: Number(r.rate),
        currency: r.currency,
        estimatedDays: r.estimatedDays
      });
    }

    // Sort carriers by their cheapest rate
    const carriers = Object.entries(byCarrier)
      .map(([carrier, options]) => ({
        carrier,
        cheapestRate: Math.min(...options.map(o => o.rate)),
        options
      }))
      .sort((a, b) => a.cheapestRate - b.cheapestRate);

    return {
      weight,
      zone: zone || 'ALL',
      totalOptions: rates.length,
      carriers
    };
  }

  /**
   * Bulk update shipment statuses. Validates each transition independently.
   * Returns a list of results with success/failure per shipment.
   */
  async bulkUpdateStatus(updates: Array<{ id: number; status: string }>) {
    const results: Array<{ id: number; success: boolean; error?: string; shipment?: any }> = [];

    for (const update of updates) {
      try {
        const shipment = await this.updateShipmentStatus(update.id, update.status);
        results.push({ id: update.id, success: true, shipment });
      } catch (err: any) {
        results.push({ id: update.id, success: false, error: err.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    try { io.emit('shipping:bulk_status_updated', { successCount, failCount }); } catch {}

    return { total: updates.length, successCount, failCount, results };
  }

  /**
   * Aggregate shipping analytics for a tenant:
   * total shipments, breakdown by status, on-time rate, average delivery time.
   */
  async getShippingAnalytics(tenantId: string) {
    const where: any = { tenantId };

    // Total count
    const totalShipments = await Shipment.count({ where });

    // Count by status
    const statusCounts = await Shipment.findAll({
      where,
      attributes: ['status', [fn('COUNT', col('id')), 'count']],
      group: ['status'],
      raw: true
    }) as unknown as Array<{ status: string; count: string }>;

    const byStatus: Record<string, number> = {};
    for (const row of statusCounts) byStatus[row.status] = Number(row.count);

    // Delivered shipments — compute on-time rate and average delivery time
    const delivered = await Shipment.findAll({
      where: { ...where, status: 'DELIVERED', actualDelivery: { [Op.ne]: null } }
    });

    let onTimeCount = 0;
    let totalDeliveryDays = 0;
    let deliveredWithEstimate = 0;

    for (const s of delivered) {
      if (s.createdAt && s.actualDelivery) {
        const days = Math.ceil(
          (new Date(s.actualDelivery).getTime() - new Date(s.createdAt as any).getTime()) / (1000 * 60 * 60 * 24)
        );
        totalDeliveryDays += days;
      }
      if (s.estimatedDelivery && s.actualDelivery) {
        deliveredWithEstimate++;
        if (new Date(s.actualDelivery) <= new Date(s.estimatedDelivery)) {
          onTimeCount++;
        }
      }
    }

    const avgDeliveryDays = delivered.length > 0 ? Number((totalDeliveryDays / delivered.length).toFixed(1)) : null;
    const onTimeRate = deliveredWithEstimate > 0
      ? Number(((onTimeCount / deliveredWithEstimate) * 100).toFixed(1))
      : null;

    return {
      totalShipments,
      byStatus,
      delivered: delivered.length,
      avgDeliveryDays,
      onTimeRate,
      onTimeCount,
      deliveredWithEstimate
    };
  }
}
export default new ShippingService();
