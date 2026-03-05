import { Op, fn, col, literal } from 'sequelize';
import Commission from './commissionModel';
import User from '../user/userModel';
import Deal from '../deal/model/dealModel';
import { sequelize } from '../config/db';
import { clampPagination } from '../utils/pagination';
import { io } from '../server';

/** Tier definition for tiered commission calculations */
interface CommissionTier {
  upTo: number;   // upper bound of the tier (use Infinity for the last tier)
  rate: number;   // rate as a decimal, e.g. 0.05 for 5%
}

/** Commission Plan types */
export type CommissionPlanType = 'PERCENTAGE' | 'TIERED' | 'FLAT';

export interface CommissionPlan {
  type: CommissionPlanType;
  name: string;
  /** For PERCENTAGE plans: a single rate (e.g. 5 = 5%) */
  rate?: number;
  /** For TIERED plans: array of tiers */
  tiers?: CommissionTier[];
  /** For FLAT plans: fixed amount per deal */
  flatAmount?: number;
}

class CommissionService {
  // ─── Existing CRUD ──────────────────────────────────────────────────────────

  async create(data: any, tenantId?: string) {
    const commission = await Commission.create({ ...data, tenantId });
    try { io.emit('commission:created', { id: commission.id, staffId: commission.staffId, amount: commission.amount, status: commission.status }); } catch {}
    return commission;
  }

  async getAll(query: any, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.status) where.status = query.status;
    if (query.staffId) where.staffId = query.staffId;
    if (query.search) where[Op.or] = [{ notes: { [Op.iLike]: `%${query.search}%` } }];

    const { rows, count } = await Commission.findAndCountAll({
      where,
      include: [
        { model: User, as: 'staff', attributes: ['id', 'name', 'email'] },
        { model: Deal, as: 'deal', attributes: ['id', 'name', 'price'] }
      ],
      order: [['createdAt', 'DESC']], limit, offset, distinct: true
    });
    return { docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
  }

  async update(id: number, data: any) {
    const commission = await Commission.findByPk(id);
    if (!commission) return null;
    if (data.status === 'PAID' && !commission.paidAt) data.paidAt = new Date();
    await commission.update(data);
    return commission;
  }

  async delete(id: number) {
    const commission = await Commission.findByPk(id);
    if (!commission) return false;
    await commission.destroy();
    return true;
  }

  // ─── Business Logic ─────────────────────────────────────────────────────────

  /**
   * Calculate commission for a deal and create the commission record.
   * Looks up the deal's price, applies the given rate (default 5%),
   * and persists a PENDING commission record.
   */
  async calculateCommission(dealId: string, userId: number, tenantId?: string, rateOverride?: number) {
    const deal = await Deal.findByPk(dealId);
    if (!deal) throw new Error(`Deal ${dealId} not found`);

    const dealValue = Number(deal.price) || 0;
    if (dealValue <= 0) throw new Error('Deal has no positive value — cannot calculate commission');

    // Use explicit override, else default 5%
    const rate = rateOverride ?? 5;
    const amount = parseFloat(((dealValue * rate) / 100).toFixed(2));

    const commission = await Commission.create({
      staffId: userId,
      dealId,
      amount,
      rate,
      dealValue,
      status: 'PENDING',
      tenantId,
      notes: `Auto-calculated ${rate}% commission on deal "${deal.name}"`
    });

    try { io.emit('commission:created', { id: commission.id, staffId: userId, dealId, amount, status: 'PENDING' }); } catch {}
    return commission;
  }

  /**
   * Calculate commission using tiered rates.
   * Example tiers: [{ upTo: 10000, rate: 0.03 }, { upTo: 50000, rate: 0.05 }, { upTo: Infinity, rate: 0.07 }]
   * For a dealValue of 70000:
   *   first 10K  -> 10000 * 0.03 = 300
   *   next  40K  -> 40000 * 0.05 = 2000
   *   last  20K  -> 20000 * 0.07 = 1400
   *   total = 3700
   */
  calculateTieredCommission(dealValue: number, tiers: CommissionTier[]): { total: number; breakdown: { from: number; to: number; rate: number; amount: number }[] } {
    if (dealValue <= 0) return { total: 0, breakdown: [] };

    // Sort tiers by upper bound ascending
    const sorted = [...tiers].sort((a, b) => a.upTo - b.upTo);
    let remaining = dealValue;
    let prevBound = 0;
    let total = 0;
    const breakdown: { from: number; to: number; rate: number; amount: number }[] = [];

    for (const tier of sorted) {
      if (remaining <= 0) break;
      const tierSize = tier.upTo === Infinity ? remaining : Math.min(tier.upTo - prevBound, remaining);
      const amount = parseFloat((tierSize * tier.rate).toFixed(2));
      breakdown.push({ from: prevBound, to: prevBound + tierSize, rate: tier.rate, amount });
      total += amount;
      remaining -= tierSize;
      prevBound = tier.upTo === Infinity ? prevBound + tierSize : tier.upTo;
    }

    return { total: parseFloat(total.toFixed(2)), breakdown };
  }

  /**
   * Aggregated commission summary for a user.
   * Uses SQL aggregation — no bulk loading into memory.
   * Returns total earned, total paid, total pending, plus monthly breakdown.
   */
  async getCommissionSummary(userId: number, tenantId?: string) {
    const where: Record<string, any> = { staffId: userId };
    if (tenantId) where.tenantId = tenantId;

    // Overall totals via SQL aggregation
    const totals = await Commission.findOne({
      attributes: [
        [fn('COALESCE', fn('SUM', col('amount')), 0), 'totalEarned'],
        [fn('COALESCE', fn('SUM', literal(`CASE WHEN status = 'PAID' THEN amount ELSE 0 END`)), 0), 'totalPaid'],
        [fn('COALESCE', fn('SUM', literal(`CASE WHEN status = 'PENDING' THEN amount ELSE 0 END`)), 0), 'totalPending'],
        [fn('COALESCE', fn('SUM', literal(`CASE WHEN status = 'APPROVED' THEN amount ELSE 0 END`)), 0), 'totalApproved'],
        [fn('COUNT', col('id')), 'totalDeals']
      ],
      where,
      raw: true
    });

    // Monthly breakdown via SQL aggregation
    const monthly = await Commission.findAll({
      attributes: [
        [fn('to_char', col('createdAt'), 'YYYY-MM'), 'month'],
        [fn('SUM', col('amount')), 'earned'],
        [fn('SUM', literal(`CASE WHEN status = 'PAID' THEN amount ELSE 0 END`)), 'paid'],
        [fn('SUM', literal(`CASE WHEN status = 'PENDING' THEN amount ELSE 0 END`)), 'pending'],
        [fn('COUNT', col('id')), 'dealCount']
      ],
      where,
      group: [fn('to_char', col('createdAt'), 'YYYY-MM')],
      order: [[fn('to_char', col('createdAt'), 'YYYY-MM'), 'DESC']],
      raw: true
    });

    return { totals, monthly };
  }

  /**
   * Mark a commission as PAID, set paidAt timestamp.
   */
  async markAsPaid(id: number) {
    const commission = await Commission.findByPk(id);
    if (!commission) return null;
    if (commission.status === 'PAID') return commission; // already paid

    await commission.update({ status: 'PAID', paidAt: new Date() });
    try { io.emit('commission:paid', { id: commission.id, staffId: commission.staffId, amount: commission.amount }); } catch {}
    return commission;
  }

  /**
   * Team commission summary — per-user aggregation for a tenant.
   * Optionally filtered by period (startDate/endDate).
   */
  async getTeamCommissions(tenantId: string, period?: { startDate?: string; endDate?: string }) {
    const where: Record<string, any> = { tenantId };
    if (period?.startDate || period?.endDate) {
      where.createdAt = {};
      if (period.startDate) where.createdAt[Op.gte] = new Date(period.startDate);
      if (period.endDate) where.createdAt[Op.lte] = new Date(period.endDate);
    }

    const results = await Commission.findAll({
      attributes: [
        'staffId',
        [fn('SUM', col('amount')), 'totalEarned'],
        [fn('SUM', literal(`CASE WHEN status = 'PAID' THEN amount ELSE 0 END`)), 'totalPaid'],
        [fn('SUM', literal(`CASE WHEN status = 'PENDING' THEN amount ELSE 0 END`)), 'totalPending'],
        [fn('COUNT', col('Commission.id')), 'dealCount']
      ],
      where,
      include: [{ model: User, as: 'staff', attributes: ['id', 'name', 'email'] }],
      group: ['staffId', 'staff.id'],
      order: [[fn('SUM', col('amount')), 'DESC']],
      raw: false
    });

    return results;
  }

  // ─── Commission Plans (stateless calculation) ─────────────────────────────

  /**
   * Apply a commission plan to a deal and create the commission record.
   * Supports percentage, tiered, and flat-fee plans.
   */
  async applyCommissionPlan(dealId: string, userId: number, plan: CommissionPlan, tenantId?: string) {
    const deal = await Deal.findByPk(dealId);
    if (!deal) throw new Error(`Deal ${dealId} not found`);

    const dealValue = Number(deal.price) || 0;
    if (dealValue <= 0 && plan.type !== 'FLAT') throw new Error('Deal has no positive value');

    let amount = 0;
    let rate: number | undefined;
    let notes = '';

    switch (plan.type) {
      case 'PERCENTAGE': {
        rate = plan.rate ?? 5;
        amount = parseFloat(((dealValue * rate) / 100).toFixed(2));
        notes = `${plan.name}: ${rate}% of ${dealValue}`;
        break;
      }
      case 'TIERED': {
        if (!plan.tiers?.length) throw new Error('Tiered plan requires tiers array');
        const result = this.calculateTieredCommission(dealValue, plan.tiers);
        amount = result.total;
        notes = `${plan.name}: tiered commission on ${dealValue} = ${amount}`;
        break;
      }
      case 'FLAT': {
        amount = plan.flatAmount ?? 0;
        notes = `${plan.name}: flat fee ${amount} per deal`;
        break;
      }
    }

    const commission = await Commission.create({
      staffId: userId,
      dealId,
      amount,
      rate,
      dealValue,
      status: 'PENDING',
      tenantId,
      notes
    });

    try { io.emit('commission:created', { id: commission.id, staffId: userId, dealId, amount, status: 'PENDING' }); } catch {}
    return commission;
  }

  // ─── Deal-Won Auto-Commission ─────────────────────────────────────────────

  /**
   * Called when a deal moves to CLOSED/WON status.
   * Creates a commission record for the deal owner.
   * Skips if a commission for this deal already exists.
   */
  async onDealWon(dealId: string, userId: number, tenantId?: string, rateOverride?: number) {
    // Check for existing commission on this deal to avoid duplicates
    const existing = await Commission.findOne({ where: { dealId, staffId: userId } });
    if (existing) return existing;

    return this.calculateCommission(dealId, userId, tenantId, rateOverride);
  }

  // ─── Bulk Payout ──────────────────────────────────────────────────────────

  /**
   * Mark multiple commissions as PAID in a single transaction.
   * Useful for monthly/quarterly payout runs.
   */
  async bulkPayout(ids: number[]) {
    const now = new Date();
    const [affectedCount] = await Commission.update(
      { status: 'PAID', paidAt: now },
      { where: { id: { [Op.in]: ids }, status: { [Op.ne]: 'PAID' } } }
    );
    try { io.emit('commission:bulkPaid', { count: affectedCount }); } catch {}
    return { paidCount: affectedCount };
  }

  // ─── Analytics ─────────────────────────────────────────────────────────────

  /**
   * Commission analytics: aggregated stats across the tenant.
   * Filterable by period, staffId, dealType.
   */
  async getAnalytics(tenantId?: string, query?: {
    startDate?: string;
    endDate?: string;
    staffId?: number;
    period?: 'monthly' | 'quarterly';
  }) {
    const where: Record<string, any> = {};
    if (tenantId) where.tenantId = tenantId;
    if (query?.staffId) where.staffId = query.staffId;
    if (query?.startDate || query?.endDate) {
      where.createdAt = {};
      if (query?.startDate) where.createdAt[Op.gte] = new Date(query.startDate);
      if (query?.endDate) where.createdAt[Op.lte] = new Date(query.endDate);
    }

    // Totals
    const totals = await Commission.findOne({
      attributes: [
        [fn('COALESCE', fn('SUM', col('amount')), 0), 'totalEarned'],
        [fn('COALESCE', fn('SUM', literal(`CASE WHEN status = 'PAID' THEN amount ELSE 0 END`)), 0), 'totalPaid'],
        [fn('COALESCE', fn('SUM', literal(`CASE WHEN status = 'PENDING' THEN amount ELSE 0 END`)), 0), 'totalPending'],
        [fn('COALESCE', fn('SUM', literal(`CASE WHEN status = 'APPROVED' THEN amount ELSE 0 END`)), 0), 'totalApproved'],
        [fn('COALESCE', fn('SUM', literal(`CASE WHEN status = 'REJECTED' THEN amount ELSE 0 END`)), 0), 'totalRejected'],
        [fn('COUNT', col('id')), 'totalRecords'],
        [fn('COALESCE', fn('AVG', col('rate')), 0), 'avgRate'],
        [fn('COALESCE', fn('AVG', col('amount')), 0), 'avgCommission']
      ],
      where,
      raw: true
    });

    // Group format based on requested period
    const groupFormat = query?.period === 'quarterly' ? 'YYYY-"Q"Q' : 'YYYY-MM';
    const byPeriod = await Commission.findAll({
      attributes: [
        [fn('to_char', col('createdAt'), groupFormat), 'period'],
        [fn('SUM', col('amount')), 'earned'],
        [fn('SUM', literal(`CASE WHEN status = 'PAID' THEN amount ELSE 0 END`)), 'paid'],
        [fn('SUM', literal(`CASE WHEN status = 'PENDING' THEN amount ELSE 0 END`)), 'pending'],
        [fn('COUNT', col('id')), 'count']
      ],
      where,
      group: [fn('to_char', col('createdAt'), groupFormat)],
      order: [[fn('to_char', col('createdAt'), groupFormat), 'DESC']],
      raw: true
    });

    // By sales rep (top earners)
    const byRep = await Commission.findAll({
      attributes: [
        'staffId',
        [fn('SUM', col('amount')), 'totalEarned'],
        [fn('COUNT', col('Commission.id')), 'dealCount'],
        [fn('AVG', col('rate')), 'avgRate']
      ],
      where,
      include: [{ model: User, as: 'staff', attributes: ['id', 'name', 'email'] }],
      group: ['staffId', 'staff.id'],
      order: [[fn('SUM', col('amount')), 'DESC']],
      limit: 20,
      raw: false
    });

    // By status breakdown
    const byStatus = await Commission.findAll({
      attributes: [
        'status',
        [fn('COUNT', col('id')), 'count'],
        [fn('SUM', col('amount')), 'total']
      ],
      where,
      group: ['status'],
      raw: true
    });

    return { totals, byPeriod, byRep, byStatus };
  }

  // ─── Global KPI Summary (for dashboard cards) ─────────────────────────────

  /**
   * Quick KPI stats for the commission dashboard.
   * Works without a userId — returns totals for the entire tenant.
   */
  async getDashboardKPIs(tenantId?: string) {
    const where: Record<string, any> = {};
    if (tenantId) where.tenantId = tenantId;

    const result = await Commission.findOne({
      attributes: [
        [fn('COALESCE', fn('SUM', col('amount')), 0), 'totalEarned'],
        [fn('COALESCE', fn('SUM', literal(`CASE WHEN status = 'PAID' THEN amount ELSE 0 END`)), 0), 'totalPaid'],
        [fn('COALESCE', fn('SUM', literal(`CASE WHEN status = 'PENDING' THEN amount ELSE 0 END`)), 0), 'totalPending'],
        [fn('COALESCE', fn('SUM', literal(`CASE WHEN status = 'APPROVED' THEN amount ELSE 0 END`)), 0), 'totalApproved'],
        [fn('COUNT', col('id')), 'totalRecords'],
        [fn('COALESCE', fn('AVG', col('rate')), 0), 'avgRate']
      ],
      where,
      raw: true
    });

    return result;
  }
}

export default new CommissionService();
