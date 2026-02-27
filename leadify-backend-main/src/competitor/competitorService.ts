import { Op, fn, col, literal } from 'sequelize';
import Competitor from './competitorModel';
import { clampPagination } from '../utils/pagination';
import { io } from '../server';

class CompetitorService {
  // ─── Existing CRUD ──────────────────────────────────────────────────────────

  async create(data: any, tenantId?: string) {
    const competitor = await Competitor.create({ ...data, tenantId });
    try { io.emit('competitor:created', { id: competitor.id, name: competitor.name }); } catch {}
    return competitor;
  }

  async getAll(query: any, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.status) where.status = query.status;
    if (query.threatLevel) where.threatLevel = query.threatLevel;
    if (query.search) where.name = { [Op.iLike]: `%${query.search}%` };

    const { rows, count } = await Competitor.findAndCountAll({
      where, order: [['createdAt', 'DESC']], limit, offset, distinct: true
    });
    return { docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
  }

  async getById(id: number) {
    return Competitor.findByPk(id);
  }

  async update(id: number, data: any) {
    const item = await Competitor.findByPk(id);
    if (!item) return null;
    await item.update(data);
    try { io.emit('competitor:updated', { id: item.id, name: item.name }); } catch {}
    return item;
  }

  async delete(id: number) {
    const item = await Competitor.findByPk(id);
    if (!item) return false;
    await item.destroy();
    return true;
  }

  // ─── Business Logic ─────────────────────────────────────────────────────────

  /**
   * Get win/loss analysis for a specific competitor.
   * Uses the dealsWon / dealsLost counters on the Competitor model.
   * Returns win rate, loss rate, total engagements, and the competitor details.
   */
  async getCompetitorAnalysis(competitorId: number, tenantId?: string) {
    const where: any = { id: competitorId };
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
    if (lossRate > 60) derivedThreatLevel = 'HIGH';
    else if (lossRate >= 40) derivedThreatLevel = 'MEDIUM';
    else derivedThreatLevel = 'LOW';
    // CRITICAL if they beat us often AND have high volume
    if (lossRate > 60 && total >= 10) derivedThreatLevel = 'CRITICAL';

    return {
      competitor,
      analysis: {
        dealsWon: won,        // deals WE won against them
        dealsLost: lost,      // deals WE lost to them
        totalEngagements: total,
        ourWinRate: winRate,
        ourLossRate: lossRate,
        derivedThreatLevel
      }
    };
  }

  /**
   * Threat matrix — all competitors with their threat level, win rate, and deal count.
   * Uses SQL aggregation on dealsWon / dealsLost columns.
   * Sorted by threat level (CRITICAL > HIGH > MEDIUM > LOW), then by loss rate descending.
   */
  async getThreatMatrix(tenantId: string) {
    const where: any = { tenantId, status: 'ACTIVE' };

    const competitors = await Competitor.findAll({
      where,
      attributes: [
        'id', 'name', 'website', 'industry', 'threatLevel', 'dealsWon', 'dealsLost', 'strengths', 'weaknesses',
        // Computed total engagements
        [literal(`COALESCE("dealsWon", 0) + COALESCE("dealsLost", 0)`), 'totalEngagements'],
        // Computed our win rate (we won / total * 100)
        [literal(`CASE WHEN COALESCE("dealsWon", 0) + COALESCE("dealsLost", 0) > 0
          THEN ROUND(COALESCE("dealsWon", 0)::numeric / (COALESCE("dealsWon", 0) + COALESCE("dealsLost", 0)) * 100, 1)
          ELSE 0 END`), 'ourWinRate'],
        // Computed our loss rate
        [literal(`CASE WHEN COALESCE("dealsWon", 0) + COALESCE("dealsLost", 0) > 0
          THEN ROUND(COALESCE("dealsLost", 0)::numeric / (COALESCE("dealsWon", 0) + COALESCE("dealsLost", 0)) * 100, 1)
          ELSE 0 END`), 'ourLossRate']
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

  /**
   * Auto-calculate and update threat level based on win/loss rates.
   * >60% losses to them = HIGH, 40-60% = MEDIUM, <40% = LOW.
   * CRITICAL if >60% losses AND total engagements >= 10.
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

    const updatePayload: any = { threatLevel };
    if (data?.strengths !== undefined) updatePayload.strengths = data.strengths;
    if (data?.weaknesses !== undefined) updatePayload.weaknesses = data.weaknesses;
    if (data?.notes !== undefined) updatePayload.notes = data.notes;

    await competitor.update(updatePayload);
    return competitor;
  }
}

export default new CompetitorService();
