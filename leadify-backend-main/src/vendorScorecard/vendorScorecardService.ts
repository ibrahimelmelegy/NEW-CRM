import VendorScorecard from './vendorScorecardModel';
import Vendor from '../vendor/vendorModel';
import { clampPagination } from '../utils/pagination';

class VendorScorecardService {
  async create(data: Record<string, unknown>, tenantId?: string) {
    const scores = [data.qualityScore, data.deliveryScore, data.priceScore, data.communicationScore].filter(Boolean);
    if (scores.length > 0) {
      data.overallScore = Number((scores.reduce((a: number, b: number) => a + b, 0) / scores.length).toFixed(1));
    }
    return VendorScorecard.create({ ...data, tenantId });
  }

  async getAll(query: Record<string, unknown>, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: Record<string, unknown> = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.vendorId) where.vendorId = query.vendorId;
    if (query.period) where.period = query.period;
    const { rows, count } = await VendorScorecard.findAndCountAll({
      where,
      include: [{ model: Vendor, as: 'vendor', attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      distinct: true
    });
    return { docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
  }

  async update(id: number, data: Record<string, unknown>) {
    const item = await VendorScorecard.findByPk(id);
    if (!item) return null;
    const scores = [
      data.qualityScore ?? item.qualityScore,
      data.deliveryScore ?? item.deliveryScore,
      data.priceScore ?? item.priceScore,
      data.communicationScore ?? item.communicationScore
    ].filter(Boolean);
    if (scores.length > 0) data.overallScore = Number((scores.reduce((a: number, b: number) => a + b, 0) / scores.length).toFixed(1));
    await item.update(data);
    return item;
  }

  async delete(id: number) {
    const item = await VendorScorecard.findByPk(id);
    if (!item) return false;
    await item.destroy();
    return true;
  }

  // ─── Business Logic ──────────────────────────────────────────────────────────

  /**
   * Return the historical scores for a vendor over the last N periods.
   * Also computes a trend direction: 'improving', 'declining', or 'stable'.
   */
  async getVendorTrend(vendorId: number, periods = 6) {
    const scorecards = await VendorScorecard.findAll({
      where: { vendorId },
      order: [['period', 'ASC']],
      limit: periods
    });

    if (scorecards.length === 0) {
      return { vendorId, periods: 0, trend: 'stable' as const, data: [] };
    }

    const data = scorecards.map(s => ({
      period: s.period,
      overallScore: Number(s.overallScore) || 0,
      qualityScore: Number(s.qualityScore) || 0,
      deliveryScore: Number(s.deliveryScore) || 0,
      priceScore: Number(s.priceScore) || 0,
      communicationScore: Number(s.communicationScore) || 0
    }));

    // Determine trend from overall scores
    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (data.length >= 2) {
      const firstHalf = data.slice(0, Math.floor(data.length / 2));
      const secondHalf = data.slice(Math.floor(data.length / 2));

      const avgFirst = firstHalf.reduce((sum, d) => sum + d.overallScore, 0) / firstHalf.length;
      const avgSecond = secondHalf.reduce((sum, d) => sum + d.overallScore, 0) / secondHalf.length;

      const diff = avgSecond - avgFirst;
      if (diff > 2) trend = 'improving';
      else if (diff < -2) trend = 'declining';
    }

    return { vendorId, periods: data.length, trend, data };
  }

  /**
   * Rank all vendors for a tenant by their latest overall score.
   * Returns vendors sorted from highest to lowest with rank and percentile.
   */
  async getVendorRanking(tenantId: string) {
    // Get the most recent scorecard for each vendor
    const allScorecards = await VendorScorecard.findAll({
      where: { tenantId },
      include: [{ model: Vendor, as: 'vendor', attributes: ['id', 'name'] }],
      order: [['period', 'DESC']]
    });

    // Keep only the latest scorecard per vendor
    const latestByVendor = new Map<number, any>();
    for (const sc of allScorecards) {
      if (!latestByVendor.has(sc.vendorId)) {
        latestByVendor.set(sc.vendorId, sc);
      }
    }

    const vendors = Array.from(latestByVendor.values()).map(sc => ({
      vendorId: sc.vendorId,
      vendorName: sc.vendor?.name || 'Unknown',
      period: sc.period,
      overallScore: Number(sc.overallScore) || 0,
      qualityScore: Number(sc.qualityScore) || 0,
      deliveryScore: Number(sc.deliveryScore) || 0,
      priceScore: Number(sc.priceScore) || 0,
      communicationScore: Number(sc.communicationScore) || 0
    }));

    // Sort descending by overallScore
    vendors.sort((a, b) => b.overallScore - a.overallScore);

    const total = vendors.length;
    return vendors.map((v, idx) => ({
      ...v,
      rank: idx + 1,
      percentile: total > 1 ? Number((((total - idx - 1) / (total - 1)) * 100).toFixed(1)) : 100
    }));
  }

  /**
   * Calculate benchmark averages across all vendors for a tenant.
   * Returns the mean score for each dimension.
   */
  async getBenchmark(tenantId: string) {
    // Get the latest scorecard per vendor (same logic as ranking)
    const allScorecards = await VendorScorecard.findAll({
      where: { tenantId },
      order: [['period', 'DESC']]
    });

    const latestByVendor = new Map<number, any>();
    for (const sc of allScorecards) {
      if (!latestByVendor.has(sc.vendorId)) {
        latestByVendor.set(sc.vendorId, sc);
      }
    }

    const scorecards = Array.from(latestByVendor.values());
    const count = scorecards.length;

    if (count === 0) {
      return {
        vendorCount: 0,
        benchmarks: { overall: 0, quality: 0, delivery: 0, price: 0, communication: 0 }
      };
    }

    let totalOverall = 0,
      totalQuality = 0,
      totalDelivery = 0,
      totalPrice = 0,
      totalComm = 0;
    for (const sc of scorecards) {
      totalOverall += Number(sc.overallScore) || 0;
      totalQuality += Number(sc.qualityScore) || 0;
      totalDelivery += Number(sc.deliveryScore) || 0;
      totalPrice += Number(sc.priceScore) || 0;
      totalComm += Number(sc.communicationScore) || 0;
    }

    return {
      vendorCount: count,
      benchmarks: {
        overall: Number((totalOverall / count).toFixed(1)),
        quality: Number((totalQuality / count).toFixed(1)),
        delivery: Number((totalDelivery / count).toFixed(1)),
        price: Number((totalPrice / count).toFixed(1)),
        communication: Number((totalComm / count).toFixed(1))
      }
    };
  }

  /**
   * Flag vendors whose latest overall score is below a threshold (default 60).
   * Returns underperforming vendors with their weak dimensions highlighted.
   */
  async flagUnderperformers(tenantId: string, threshold = 60) {
    const allScorecards = await VendorScorecard.findAll({
      where: { tenantId },
      include: [{ model: Vendor, as: 'vendor', attributes: ['id', 'name'] }],
      order: [['period', 'DESC']]
    });

    const latestByVendor = new Map<number, any>();
    for (const sc of allScorecards) {
      if (!latestByVendor.has(sc.vendorId)) {
        latestByVendor.set(sc.vendorId, sc);
      }
    }

    const underperformers: Array<{
      vendorId: number;
      vendorName: string;
      period: string;
      overallScore: number;
      weakDimensions: Array<{ dimension: string; score: number }>;
    }> = [];

    for (const sc of latestByVendor.values()) {
      const overall = Number(sc.overallScore) || 0;
      if (overall >= threshold) continue;

      const weakDimensions: Array<{ dimension: string; score: number }> = [];
      const dimensions: Array<[string, number | undefined]> = [
        ['quality', sc.qualityScore],
        ['delivery', sc.deliveryScore],
        ['price', sc.priceScore],
        ['communication', sc.communicationScore]
      ];

      for (const [dim, score] of dimensions) {
        const val = Number(score) || 0;
        if (val < threshold) {
          weakDimensions.push({ dimension: dim, score: val });
        }
      }

      // Sort weak dimensions by score ascending (worst first)
      weakDimensions.sort((a, b) => a.score - b.score);

      underperformers.push({
        vendorId: sc.vendorId,
        vendorName: sc.vendor?.name || 'Unknown',
        period: sc.period,
        overallScore: overall,
        weakDimensions
      });
    }

    // Sort by overallScore ascending (worst performers first)
    underperformers.sort((a, b) => a.overallScore - b.overallScore);

    return { threshold, count: underperformers.length, vendors: underperformers };
  }
}
export default new VendorScorecardService();
