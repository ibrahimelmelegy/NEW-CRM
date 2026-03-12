import { Op, literal } from 'sequelize';
import Competitor from './competitorModel';
import CompetitorDeal from './competitorDealModel';
import Deal from '../deal/model/dealModel';
import { clampPagination } from '../utils/pagination';
import { io } from '../server';

class CompetitorService {
  // ─── CRUD ─────────────────────────────────────────────────────────────────────

  async create(data: Record<string, unknown>, tenantId?: string, createdBy?: number) {
    const competitor = await Competitor.create({ ...data, tenantId, createdBy });
    try {
      io.emit('competitor:created', { id: competitor.id, name: competitor.name });
    } catch {}
    return competitor;
  }

  async getAll(query: Record<string, unknown>, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: Record<string, any> = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.status) where.status = query.status;
    if (query.industry) where.industry = { [Op.iLike]: `%${query.industry}%` };
    if (query.size) where.size = query.size;
    if (query.threatLevel) where.threatLevel = query.threatLevel;
    if (query.search) where.name = { [Op.iLike]: `%${query.search}%` };

    const { rows, count } = await Competitor.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      distinct: true
    });
    return { rows, count, docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
  }

  async getById(id: number) {
    return Competitor.findByPk(id);
  }

  async update(id: number, data: Record<string, unknown>) {
    const item = await Competitor.findByPk(id);
    if (!item) return null;
    await item.update(data);
    try {
      io.emit('competitor:updated', { id: item.id, name: item.name });
    } catch {}
    return item;
  }

  async delete(id: number) {
    const item = await Competitor.findByPk(id);
    if (!item) return false;
    await item.destroy();
    // Also remove any deal associations
    await CompetitorDeal.destroy({ where: { competitorId: id } });
    try {
      io.emit('competitor:deleted', { id });
    } catch {}
    return true;
  }

  // ─── Deal Association ─────────────────────────────────────────────────────────

  /** Link a competitor to a deal */
  async linkDeal(competitorId: number, dealId: string, data: { outcome?: string; notes?: string } = {}, tenantId?: string) {
    // Prevent duplicate links
    const existing = await CompetitorDeal.findOne({ where: { competitorId, dealId } });
    if (existing) {
      await existing.update({ outcome: data.outcome || existing.outcome, notes: data.notes ?? existing.notes });
      return existing;
    }
    return CompetitorDeal.create({
      competitorId,
      dealId,
      outcome: data.outcome || 'PENDING',
      notes: data.notes || null,
      tenantId
    });
  }

  /** Unlink a competitor from a deal */
  async unlinkDeal(competitorId: number, dealId: string) {
    const deleted = await CompetitorDeal.destroy({ where: { competitorId, dealId } });
    return deleted > 0;
  }

  /** Get all deals linked to a competitor */
  async getCompetitorDeals(competitorId: number, tenantId?: string) {
    const where: Record<string, any> = { competitorId };
    if (tenantId) where.tenantId = tenantId;
    return CompetitorDeal.findAll({
      where,
      include: [{ model: Deal, as: 'deal', attributes: ['id', 'name', 'status'] }],
      order: [['createdAt', 'DESC']]
    });
  }

  // ─── Win/Loss Analysis ────────────────────────────────────────────────────────

  /**
   * Get win/loss analysis for a specific competitor.
   * Uses the dealsWon / dealsLost counters on the Competitor model.
   */
  async getCompetitorAnalysis(competitorId: number, tenantId?: string) {
    const where: Record<string, any> = { id: competitorId };
    if (tenantId) where.tenantId = tenantId;

    const competitor = await Competitor.findOne({ where });
    if (!competitor) return null;

    const won = Number(competitor.dealsWon) || 0;
    const lost = Number(competitor.dealsLost) || 0;
    const total = won + lost;
    const winRate = total > 0 ? parseFloat(((won / total) * 100).toFixed(1)) : 0;
    const lossRate = total > 0 ? parseFloat(((lost / total) * 100).toFixed(1)) : 0;

    // Derive threat level from their win rate (wins for THEM = losses for us)
    let derivedThreatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    if (lossRate > 60 && total >= 10) derivedThreatLevel = 'CRITICAL';
    else if (lossRate > 60) derivedThreatLevel = 'HIGH';
    else if (lossRate >= 40) derivedThreatLevel = 'MEDIUM';
    else derivedThreatLevel = 'LOW';

    return {
      competitor,
      analysis: {
        dealsWon: won,
        dealsLost: lost,
        totalEngagements: total,
        winRate,
        lossRate,
        derivedThreatLevel
      }
    };
  }

  // ─── Threat Matrix ────────────────────────────────────────────────────────────

  /**
   * Threat matrix -- all competitors with their threat level, win rate, and deal count.
   * Sorted by threat severity, then by loss rate descending.
   */
  async getThreatMatrix(tenantId?: string) {
    const where: Record<string, any> = { status: 'ACTIVE' };
    if (tenantId) where.tenantId = tenantId;

    const competitors = await Competitor.findAll({
      where,
      attributes: [
        'id',
        'name',
        'website',
        'industry',
        'threatLevel',
        'dealsWon',
        'dealsLost',
        'strengths',
        'weaknesses',
        'size',
        'marketShare',
        // Computed total engagements
        [literal(`COALESCE("dealsWon", 0) + COALESCE("dealsLost", 0)`), 'totalEngagements'],
        // Computed our win rate (we won / total * 100)
        [
          literal(`CASE WHEN COALESCE("dealsWon", 0) + COALESCE("dealsLost", 0) > 0
          THEN ROUND(COALESCE("dealsWon", 0)::numeric / (COALESCE("dealsWon", 0) + COALESCE("dealsLost", 0)) * 100, 1)
          ELSE 0 END`),
          'winRate'
        ],
        // Computed our loss rate
        [
          literal(`CASE WHEN COALESCE("dealsWon", 0) + COALESCE("dealsLost", 0) > 0
          THEN ROUND(COALESCE("dealsLost", 0)::numeric / (COALESCE("dealsWon", 0) + COALESCE("dealsLost", 0)) * 100, 1)
          ELSE 0 END`),
          'lossRate'
        ]
      ],
      order: [
        // Sort by threat severity: CRITICAL first, then HIGH, MEDIUM, LOW, NULLs last
        [literal(`CASE "threatLevel" WHEN 'CRITICAL' THEN 0 WHEN 'HIGH' THEN 1 WHEN 'MEDIUM' THEN 2 WHEN 'LOW' THEN 3 ELSE 4 END`), 'ASC'],
        [literal(`COALESCE("dealsLost", 0)`), 'DESC']
      ],
      raw: true
    });

    return competitors;
  }

  // ─── Threat Level Auto-Calculation ────────────────────────────────────────────

  /**
   * Auto-calculate and update threat level based on win/loss rates.
   * Also allows manual data overrides (strengths, weaknesses, notes).
   */
  async updateThreatLevel(id: number, data?: { strengths?: string; weaknesses?: string; notes?: string }) {
    const competitor = await Competitor.findByPk(id);
    if (!competitor) return null;

    const won = Number(competitor.dealsWon) || 0;
    const lost = Number(competitor.dealsLost) || 0;
    const total = won + lost;
    const lossRate = total > 0 ? (lost / total) * 100 : 0;

    let threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    if (lossRate > 60 && total >= 10) threatLevel = 'CRITICAL';
    else if (lossRate > 60) threatLevel = 'HIGH';
    else if (lossRate >= 40) threatLevel = 'MEDIUM';
    else threatLevel = 'LOW';

    const updatePayload: Record<string, any> = { threatLevel };
    if (data?.strengths !== undefined) updatePayload.strengths = data.strengths;
    if (data?.weaknesses !== undefined) updatePayload.weaknesses = data.weaknesses;
    if (data?.notes !== undefined) updatePayload.notes = data.notes;

    await competitor.update(updatePayload);
    return competitor;
  }

  // ─── Analytics ────────────────────────────────────────────────────────────────

  /**
   * Competitive landscape: market share comparison across all active competitors.
   */
  async getMarketLandscape(tenantId?: string) {
    const where: Record<string, any> = { status: 'ACTIVE' };
    if (tenantId) where.tenantId = tenantId;

    const competitors = await Competitor.findAll({
      where,
      attributes: ['id', 'name', 'marketShare', 'industry', 'size', 'rating'],
      order: [['marketShare', 'DESC']],
      raw: true
    });

    const totalMarketShare = competitors.reduce((sum, c) => sum + (Number((c as any).marketShare) || 0), 0);

    return {
      competitors,
      totalMarketShare,
      count: competitors.length
    };
  }

  /**
   * Top threats: competitors with the highest threat level and engagement count.
   */
  async getTopThreats(tenantId?: string, limit = 5) {
    const where: Record<string, any> = { status: 'ACTIVE' };
    if (tenantId) where.tenantId = tenantId;

    return Competitor.findAll({
      where,
      attributes: [
        'id',
        'name',
        'threatLevel',
        'dealsWon',
        'dealsLost',
        'marketShare',
        'industry',
        [literal(`COALESCE("dealsWon", 0) + COALESCE("dealsLost", 0)`), 'totalEngagements'],
        [
          literal(`CASE WHEN COALESCE("dealsWon", 0) + COALESCE("dealsLost", 0) > 0
          THEN ROUND(COALESCE("dealsLost", 0)::numeric / (COALESCE("dealsWon", 0) + COALESCE("dealsLost", 0)) * 100, 1)
          ELSE 0 END`),
          'lossRate'
        ]
      ],
      order: [
        [literal(`CASE "threatLevel" WHEN 'CRITICAL' THEN 0 WHEN 'HIGH' THEN 1 WHEN 'MEDIUM' THEN 2 WHEN 'LOW' THEN 3 ELSE 4 END`), 'ASC'],
        [literal(`COALESCE("dealsLost", 0)`), 'DESC']
      ],
      limit,
      raw: true
    });
  }

  /**
   * Win rate by competitor: summary stats for all competitors.
   */
  async getWinRateStats(tenantId?: string) {
    const where: Record<string, any> = { status: 'ACTIVE' };
    if (tenantId) where.tenantId = tenantId;

    return Competitor.findAll({
      where,
      attributes: [
        'id',
        'name',
        [literal(`COALESCE("dealsWon", 0)`), 'dealsWon'],
        [literal(`COALESCE("dealsLost", 0)`), 'dealsLost'],
        [literal(`COALESCE("dealsWon", 0) + COALESCE("dealsLost", 0)`), 'totalEngagements'],
        [
          literal(`CASE WHEN COALESCE("dealsWon", 0) + COALESCE("dealsLost", 0) > 0
          THEN ROUND(COALESCE("dealsWon", 0)::numeric / (COALESCE("dealsWon", 0) + COALESCE("dealsLost", 0)) * 100, 1)
          ELSE 0 END`),
          'winRate'
        ]
      ],
      order: [[literal(`COALESCE("dealsWon", 0) + COALESCE("dealsLost", 0)`), 'DESC']],
      raw: true
    });
  }

  /**
   * Get recent competitor activity for timeline.
   * Returns recent creations, updates, and win/loss events.
   */
  async getRecentActivity(tenantId?: string, limit = 10) {
    const where: Record<string, any> = {};
    if (tenantId) where.tenantId = tenantId;

    const recent = await Competitor.findAll({
      where,
      order: [['updatedAt', 'DESC']],
      limit,
      attributes: ['id', 'name', 'createdAt', 'updatedAt', 'dealsWon', 'dealsLost', 'threatLevel']
    });

    // Build activity timeline (in real app, this would come from an audit log)
    return recent.map(c => ({
      id: c.id,
      type: 'UPDATED',
      title: `${c.name} updated`,
      description: `Competitor details modified`,
      createdAt: c.updatedAt,
      competitorId: c.id,
      competitorName: c.name
    }));
  }
}

export default new CompetitorService();
