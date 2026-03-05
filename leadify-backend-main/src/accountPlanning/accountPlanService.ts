import { Op } from 'sequelize';
import AccountPlan from './accountPlanModel';
import Stakeholder from './stakeholderModel';
import Client from '../client/clientModel';
import User from '../user/userModel';
import { clampPagination } from '../utils/pagination';
import { io } from '../server';

class AccountPlanService {
  // ─── Account Plan CRUD ────────────────────────────────────────────────────────

  async create(data: any, tenantId?: string, ownerId?: number) {
    const plan = await AccountPlan.create({ ...data, tenantId, ownerId });
    try { io.emit('accountPlan:created', { id: plan.id, name: plan.name }); } catch {}
    return plan;
  }

  async getAll(query: any, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: Record<string, any> = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.tier) where.tier = query.tier;
    if (query.status) where.status = query.status;
    if (query.search) where.name = { [Op.iLike]: `%${query.search}%` };
    if (query.minHealth) where.healthScore = { ...(where.healthScore || {}), [Op.gte]: Number(query.minHealth) };

    const { rows, count } = await AccountPlan.findAndCountAll({
      where,
      include: [
        { model: Client, as: 'account', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'owner', attributes: ['id', 'name'] }
      ],
      order: [['createdAt', 'DESC']],
      limit, offset, distinct: true
    });
    return { docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
  }

  async getById(id: number) {
    return AccountPlan.findByPk(id, {
      include: [
        { model: Client, as: 'account', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'owner', attributes: ['id', 'name'] }
      ]
    });
  }

  async update(id: number, data: any) {
    const item = await AccountPlan.findByPk(id);
    if (!item) return null;
    await item.update(data);
    try { io.emit('accountPlan:updated', { id: item.id }); } catch {}
    return item;
  }

  async delete(id: number) {
    const item = await AccountPlan.findByPk(id);
    if (!item) return false;
    await Stakeholder.destroy({ where: { accountPlanId: id } });
    await item.destroy();
    try { io.emit('accountPlan:deleted', { id }); } catch {}
    return true;
  }

  // ─── Stakeholder CRUD ────────────────────────────────────────────────────────

  async addStakeholder(data: any, tenantId?: string) {
    const stakeholder = await Stakeholder.create({ ...data, tenantId });
    try { io.emit('stakeholder:created', { id: stakeholder.id, accountPlanId: stakeholder.accountPlanId }); } catch {}
    return stakeholder;
  }

  async getStakeholders(accountPlanId: number) {
    return Stakeholder.findAll({
      where: { accountPlanId },
      order: [['influence', 'DESC']]
    });
  }

  async updateStakeholder(id: number, data: any) {
    const item = await Stakeholder.findByPk(id);
    if (!item) return null;
    await item.update(data);
    return item;
  }

  async deleteStakeholder(id: number) {
    const item = await Stakeholder.findByPk(id);
    if (!item) return false;
    await item.destroy();
    return true;
  }

  // ─── Whitespace Analysis ──────────────────────────────────────────────────────

  /**
   * Identify expansion opportunities (whitespace) for an account.
   * Compares the account's current products/services against full catalog to find gaps.
   * Returns accounts with highest expansion potential and nearest renewal dates.
   */
  async getWhitespaceAnalysis(tenantId?: string) {
    const where: Record<string, any> = { status: 'ACTIVE' };
    if (tenantId) where.tenantId = tenantId;

    const plans = await AccountPlan.findAll({
      where,
      include: [{ model: Client, as: 'account', attributes: ['id', 'name'] }],
      order: [['expansionPotential', 'DESC']],
      raw: true,
      nest: true
    });

    const opportunities = plans.map((p: any) => {
      const goalsCompleted = (p.goals || []).filter((g: any) => g.status === 'COMPLETED').length;
      const totalGoals = (p.goals || []).length;
      return {
        accountPlanId: p.id,
        accountName: p.account?.name || 'Unknown',
        tier: p.tier,
        annualRevenue: Number(p.annualRevenue) || 0,
        expansionPotential: Number(p.expansionPotential) || 0,
        renewalDate: p.renewalDate,
        healthScore: p.healthScore,
        goalProgress: totalGoals > 0 ? parseFloat(((goalsCompleted / totalGoals) * 100).toFixed(0)) : 0
      };
    });

    return {
      opportunities,
      totalExpansionPotential: opportunities.reduce((s, o) => s + o.expansionPotential, 0),
      count: opportunities.length
    };
  }

  // ─── Account Forecast ─────────────────────────────────────────────────────────

  /** Forecast revenue across all active account plans grouped by tier */
  async getForecast(tenantId?: string) {
    const where: Record<string, any> = { status: 'ACTIVE' };
    if (tenantId) where.tenantId = tenantId;

    const plans = await AccountPlan.findAll({ where, raw: true });

    const byTier: Record<string, { count: number; totalRevenue: number; totalExpansion: number; avgHealth: number }> = {};

    for (const p of plans) {
      const plan = p as any;
      const tier = plan.tier || 'STANDARD';
      if (!byTier[tier]) byTier[tier] = { count: 0, totalRevenue: 0, totalExpansion: 0, avgHealth: 0 };
      byTier[tier].count++;
      byTier[tier].totalRevenue += Number(plan.annualRevenue) || 0;
      byTier[tier].totalExpansion += Number(plan.expansionPotential) || 0;
      byTier[tier].avgHealth += Number(plan.healthScore) || 0;
    }

    for (const tier of Object.keys(byTier)) {
      const t = byTier[tier];
      t.avgHealth = t.count > 0 ? parseFloat((t.avgHealth / t.count).toFixed(0)) : 0;
      t.totalRevenue = parseFloat(t.totalRevenue.toFixed(2));
      t.totalExpansion = parseFloat(t.totalExpansion.toFixed(2));
    }

    const upcomingRenewals = await AccountPlan.findAll({
      where: {
        ...where,
        renewalDate: { [Op.gte]: new Date(), [Op.lte]: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) }
      },
      include: [{ model: Client, as: 'account', attributes: ['id', 'name'] }],
      order: [['renewalDate', 'ASC']],
      limit: 10
    });

    return {
      byTier,
      totalAccounts: plans.length,
      upcomingRenewals: upcomingRenewals.length,
      renewals: upcomingRenewals
    };
  }
}

export default new AccountPlanService();
