import { Op, fn, col, literal } from 'sequelize';
import ClvRecord from './clvModel';
import Client from '../client/clientModel';
import { clampPagination } from '../utils/pagination';
import { io } from '../server';

class ClvService {
  // ─── CRUD ─────────────────────────────────────────────────────────────────────

  async create(data: any, tenantId?: string) {
    const record = await ClvRecord.create({ ...data, tenantId, calculatedAt: new Date() });
    try { io.emit('clv:created', { id: record.id, customerId: record.customerId }); } catch {}
    return record;
  }

  async getAll(query: any, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: Record<string, any> = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.segment) where.segment = query.segment;
    if (query.customerId) where.customerId = query.customerId;
    if (query.minChurnRisk) where.churnRisk = { ...(where.churnRisk || {}), [Op.gte]: Number(query.minChurnRisk) };
    if (query.maxChurnRisk) where.churnRisk = { ...(where.churnRisk || {}), [Op.lte]: Number(query.maxChurnRisk) };

    try {
      const { rows, count } = await ClvRecord.findAndCountAll({
        where,
        include: [{ model: Client, as: 'customer', attributes: ['id', 'name', 'email'], required: false }],
        order: [['predictedRevenue', 'DESC']],
        limit, offset, distinct: true
      });
      return { docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
    } catch {
      return { docs: [], pagination: { page: 1, limit: 10, totalItems: 0, totalPages: 0 } };
    }
  }

  async getById(id: number) {
    return ClvRecord.findByPk(id, {
      include: [{ model: Client, as: 'customer', attributes: ['id', 'name', 'email'] }]
    });
  }

  async update(id: number, data: any) {
    const item = await ClvRecord.findByPk(id);
    if (!item) return null;
    await item.update(data);
    try { io.emit('clv:updated', { id: item.id }); } catch {}
    return item;
  }

  async delete(id: number) {
    const item = await ClvRecord.findByPk(id);
    if (!item) return false;
    await item.destroy();
    return true;
  }

  // ─── CLV Calculation ──────────────────────────────────────────────────────────

  /**
   * Calculate CLV for a customer using the simple CLV formula:
   * CLV = (Average Order Value * Purchase Frequency * Customer Lifespan)
   * Churn risk is estimated from recency of last purchase.
   */
  async calculateCLV(data: {
    customerId: string;
    historicalRevenue: number;
    avgOrderValue: number;
    purchaseFrequency: number;
    customerAge: number;
    lastPurchaseDate: string;
  }, tenantId?: string) {
    const { customerId, historicalRevenue, avgOrderValue, purchaseFrequency, customerAge } = data;
    const lastPurchase = new Date(data.lastPurchaseDate);

    // Predict revenue for the next 3 years based on current frequency
    const predictedYearlyRevenue = avgOrderValue * purchaseFrequency;
    const predictedRevenue = parseFloat((predictedYearlyRevenue * 3).toFixed(2));

    // Estimate churn risk based on recency (days since last purchase)
    const daysSinceLastPurchase = Math.floor((Date.now() - lastPurchase.getTime()) / (1000 * 60 * 60 * 24));
    const avgDaysBetweenPurchases = purchaseFrequency > 0 ? 365 / purchaseFrequency : 365;
    const recencyRatio = daysSinceLastPurchase / avgDaysBetweenPurchases;
    const churnRisk = parseFloat(Math.min(1, Math.max(0, (recencyRatio - 1) * 0.3 + 0.1)).toFixed(2));

    // Determine segment
    let segment: string;
    if (churnRisk > 0.7) segment = 'AT_RISK';
    else if (customerAge < 0.5) segment = 'NEW';
    else if (historicalRevenue > 50000) segment = 'HIGH_VALUE';
    else if (historicalRevenue > 10000) segment = 'MEDIUM_VALUE';
    else segment = 'LOW_VALUE';

    // Upsert: update existing record or create new
    const existing = await ClvRecord.findOne({ where: { customerId, ...(tenantId && { tenantId }) } });
    const recordData = {
      customerId,
      historicalRevenue,
      predictedRevenue,
      churnRisk,
      segment,
      avgOrderValue,
      purchaseFrequency,
      customerAge,
      lastPurchaseDate: lastPurchase,
      calculatedAt: new Date(),
      tenantId
    };

    let record: ClvRecord;
    if (existing) {
      await existing.update(recordData);
      record = existing;
    } else {
      record = await ClvRecord.create(recordData);
    }

    try { io.emit('clv:calculated', { id: record.id, customerId, segment, churnRisk }); } catch {}
    return record;
  }

  // ─── Cohort Analysis ──────────────────────────────────────────────────────────

  /** Group customers by segment and compute aggregated metrics */
  async getCohortAnalysis(tenantId?: string) {
    const where: Record<string, any> = {};
    if (tenantId) where.tenantId = tenantId;

    const records = await ClvRecord.findAll({ where, raw: true });

    const cohorts: Record<string, {
      count: number; totalHistorical: number; totalPredicted: number;
      avgChurnRisk: number; avgOrderValue: number;
    }> = {};

    for (const r of records) {
      const rec = r as any;
      const seg = rec.segment || 'UNKNOWN';
      if (!cohorts[seg]) cohorts[seg] = { count: 0, totalHistorical: 0, totalPredicted: 0, avgChurnRisk: 0, avgOrderValue: 0 };
      cohorts[seg].count++;
      cohorts[seg].totalHistorical += Number(rec.historicalRevenue) || 0;
      cohorts[seg].totalPredicted += Number(rec.predictedRevenue) || 0;
      cohorts[seg].avgChurnRisk += Number(rec.churnRisk) || 0;
      cohorts[seg].avgOrderValue += Number(rec.avgOrderValue) || 0;
    }

    // Compute averages
    for (const seg of Object.keys(cohorts)) {
      const c = cohorts[seg];
      c.avgChurnRisk = c.count > 0 ? parseFloat((c.avgChurnRisk / c.count).toFixed(2)) : 0;
      c.avgOrderValue = c.count > 0 ? parseFloat((c.avgOrderValue / c.count).toFixed(2)) : 0;
      c.totalHistorical = parseFloat(c.totalHistorical.toFixed(2));
      c.totalPredicted = parseFloat(c.totalPredicted.toFixed(2));
    }

    return { cohorts, totalCustomers: records.length };
  }

  // ─── Churn Predictions ────────────────────────────────────────────────────────

  /** Get customers at highest risk of churn, sorted by risk descending */
  async getChurnPredictions(tenantId?: string, limit = 20) {
    const where: Record<string, any> = { churnRisk: { [Op.gt]: 0.3 } };
    if (tenantId) where.tenantId = tenantId;

    const atRisk = await ClvRecord.findAll({
      where,
      include: [{ model: Client, as: 'customer', attributes: ['id', 'name', 'email'] }],
      order: [['churnRisk', 'DESC']],
      limit,
    });

    return {
      atRiskCustomers: atRisk,
      count: atRisk.length
    };
  }
}

export default new ClvService();
