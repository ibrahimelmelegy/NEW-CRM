import { Op, fn, col } from 'sequelize';
import UsageMeter from './usageMeterModel';
import UsageRecord from './usageRecordModel';
import { clampPagination } from '../utils/pagination';
import { io } from '../server';

class UsageBillingService {
  // ─── Meter CRUD ───────────────────────────────────────────────────────────────

  async createMeter(data: unknown, tenantId?: string) {
    const meter = await UsageMeter.create({ ...data, tenantId });
    try { io.emit('usageMeter:created', { id: meter.id, name: meter.name }); } catch {}
    return meter;
  }

  async getAllMeters(query: unknown, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: Record<string, unknown> = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.status) where.status = query.status;
    if (query.search) where.name = { [Op.iLike]: `%${query.search}%` };

    const { rows, count } = await UsageMeter.findAndCountAll({
      where, order: [['createdAt', 'DESC']], limit, offset, distinct: true
    });
    return { docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
  }

  async getMeterById(id: number) {
    return UsageMeter.findByPk(id);
  }

  async updateMeter(id: number, data: unknown) {
    const item = await UsageMeter.findByPk(id);
    if (!item) return null;
    await item.update(data);
    try { io.emit('usageMeter:updated', { id: item.id }); } catch {}
    return item;
  }

  async deleteMeter(id: number) {
    const item = await UsageMeter.findByPk(id);
    if (!item) return false;
    await item.destroy();
    return true;
  }

  // ─── Usage Record CRUD ────────────────────────────────────────────────────────

  async recordUsage(data: unknown, tenantId?: string) {
    if (!data.recordedAt) data.recordedAt = new Date();
    if (!data.billingPeriod) {
      const d = new Date(data.recordedAt);
      data.billingPeriod = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }
    const record = await UsageRecord.create({ ...data, tenantId });
    try { io.emit('usage:recorded', { id: record.id, meterId: record.meterId }); } catch {}
    return record;
  }

  async getUsageRecords(query: unknown, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: Record<string, unknown> = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.meterId) where.meterId = Number(query.meterId);
    if (query.customerId) where.customerId = query.customerId;
    if (query.billingPeriod) where.billingPeriod = query.billingPeriod;

    const { rows, count } = await UsageRecord.findAndCountAll({
      where,
      include: [{ model: UsageMeter, as: 'meter', attributes: ['id', 'name', 'unit', 'pricePerUnit'] }],
      order: [['recordedAt', 'DESC']],
      limit, offset, distinct: true
    });
    return { docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
  }

  // ─── Calculate Charges ────────────────────────────────────────────────────────

  /**
   * Calculate usage charges for a customer in a billing period.
   * Supports billing models: PER_UNIT, TIERED, VOLUME.
   */
  async calculateUsageCharges(customerId: string, billingPeriod: string, tenantId?: string) {
    const recordWhere: Record<string, unknown> = { customerId, billingPeriod };
    if (tenantId) recordWhere.tenantId = tenantId;

    const records = await UsageRecord.findAll({
      where: recordWhere,
      include: [{ model: UsageMeter, as: 'meter' }]
    });

    // Group by meter
    const meterUsage: Record<number, { meter: unknown; totalQuantity: number }> = {};
    for (const r of records) {
      const rec = r as any;
      if (!meterUsage[rec.meterId]) {
        meterUsage[rec.meterId] = { meter: rec.meter, totalQuantity: 0 };
      }
      meterUsage[rec.meterId].totalQuantity += rec.quantity;
    }

    const lineItems: Array<{ meterId: number; meterName: string; unit: string; quantity: number; unitPrice: number; amount: number }> = [];
    let totalAmount = 0;

    for (const [meterId, usage] of Object.entries(meterUsage)) {
      const { meter, totalQuantity } = usage;
      let amount: number;

      switch (meter.billingModel) {
        case 'TIERED': {
          // Each tier has its own price, usage fills tiers sequentially
          amount = 0;
          let remaining = totalQuantity;
          const tiers = meter.tiers || [];
          for (const tier of tiers) {
            const tierRange = tier.to - tier.from + 1;
            const tierUsage = Math.min(remaining, tierRange);
            amount += tierUsage * tier.pricePerUnit;
            remaining -= tierUsage;
            if (remaining <= 0) break;
          }
          if (remaining > 0) amount += remaining * Number(meter.pricePerUnit);
          break;
        }
        case 'VOLUME': {
          // All units priced at the tier the total falls into
          const tiers = meter.tiers || [];
          let unitPrice = Number(meter.pricePerUnit);
          for (const tier of tiers) {
            if (totalQuantity >= tier.from && (totalQuantity < tier.to || !tier.to || tier.to === Infinity)) {
              unitPrice = tier.pricePerUnit;
              break;
            }
          }
          amount = totalQuantity * unitPrice;
          break;
        }
        case 'STAIRCASE': {
          // Fixed price per tier bracket
          const tiers = meter.tiers || [];
          amount = 0;
          for (const tier of tiers) {
            if (totalQuantity >= tier.from) {
              amount = tier.pricePerUnit; // flat fee for this bracket
            }
          }
          break;
        }
        case 'PER_UNIT':
        default:
          amount = totalQuantity * Number(meter.pricePerUnit);
          break;
      }

      amount = parseFloat(amount.toFixed(2));
      totalAmount += amount;

      lineItems.push({
        meterId: Number(meterId),
        meterName: meter.name,
        unit: meter.unit,
        quantity: totalQuantity,
        unitPrice: Number(meter.pricePerUnit),
        amount
      });
    }

    return {
      customerId,
      billingPeriod,
      lineItems,
      totalAmount: parseFloat(totalAmount.toFixed(2))
    };
  }

  // ─── Generate Invoice ─────────────────────────────────────────────────────────

  /** Generate an invoice summary for a customer's usage in a billing period */
  async generateInvoice(customerId: string, billingPeriod: string, tenantId?: string) {
    const charges = await this.calculateUsageCharges(customerId, billingPeriod, tenantId);

    const invoice = {
      invoiceNumber: `INV-${billingPeriod}-${customerId.substring(0, 8).toUpperCase()}`,
      customerId,
      billingPeriod,
      generatedAt: new Date(),
      lineItems: charges.lineItems,
      subtotal: charges.totalAmount,
      tax: parseFloat((charges.totalAmount * 0.15).toFixed(2)), // 15% VAT
      total: parseFloat((charges.totalAmount * 1.15).toFixed(2)),
      status: 'DRAFT'
    };

    try { io.emit('usageInvoice:generated', { customerId, billingPeriod, total: invoice.total }); } catch {}
    return invoice;
  }
}

export default new UsageBillingService();
