import { Op, literal, fn, col } from 'sequelize';
import SocialMention from './socialMentionModel';
import { clampPagination } from '../utils/pagination';
import { io } from '../server';

/** Simple keyword-based sentiment analysis */
function analyzeSentiment(text: string): { sentiment: string; score: number } {
  const lower = text.toLowerCase();
  const positiveWords = ['great', 'love', 'excellent', 'amazing', 'awesome', 'fantastic', 'good', 'best', 'happy', 'recommend'];
  const negativeWords = ['bad', 'terrible', 'awful', 'worst', 'hate', 'horrible', 'disappointed', 'poor', 'broken', 'issue'];

  let score = 0;
  for (const w of positiveWords) { if (lower.includes(w)) score += 1; }
  for (const w of negativeWords) { if (lower.includes(w)) score -= 1; }

  const normalised = Math.max(-1, Math.min(1, score / 3));
  const sentiment = normalised > 0.2 ? 'POSITIVE' : normalised < -0.2 ? 'NEGATIVE' : 'NEUTRAL';
  return { sentiment, score: parseFloat(normalised.toFixed(2)) };
}

class SocialListeningService {
  // ─── CRUD ─────────────────────────────────────────────────────────────────────

  async create(data: any, tenantId?: string) {
    // Auto-analyse sentiment if not provided
    if (!data.sentiment && data.content) {
      const analysis = analyzeSentiment(data.content);
      data.sentiment = analysis.sentiment;
      data.sentimentScore = analysis.score;
    }
    const mention = await SocialMention.create({ ...data, tenantId });
    try { io.emit('socialMention:created', { id: mention.id, platform: mention.platform }); } catch {}
    return mention;
  }

  async getAll(query: any, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: Record<string, any> = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.platform) where.platform = query.platform;
    if (query.sentiment) where.sentiment = query.sentiment;
    if (query.status) where.status = query.status;
    if (query.keyword) where.keyword = { [Op.iLike]: `%${query.keyword}%` };
    if (query.search) where.content = { [Op.iLike]: `%${query.search}%` };
    if (query.fromDate || query.toDate) {
      where.mentionDate = {};
      if (query.fromDate) where.mentionDate[Op.gte] = new Date(query.fromDate);
      if (query.toDate) where.mentionDate[Op.lte] = new Date(query.toDate);
    }

    const { rows, count } = await SocialMention.findAndCountAll({
      where, order: [['mentionDate', 'DESC']], limit, offset, distinct: true
    });
    return { docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
  }

  async getById(id: number) {
    return SocialMention.findByPk(id);
  }

  async update(id: number, data: any) {
    const item = await SocialMention.findByPk(id);
    if (!item) return null;
    await item.update(data);
    try { io.emit('socialMention:updated', { id: item.id }); } catch {}
    return item;
  }

  async delete(id: number) {
    const item = await SocialMention.findByPk(id);
    if (!item) return false;
    await item.destroy();
    try { io.emit('socialMention:deleted', { id }); } catch {}
    return true;
  }

  // ─── Sentiment Aggregation ──────────────────────────────────────────────────

  /** Aggregate sentiment breakdown by platform and time period */
  async getSentimentAggregation(tenantId?: string, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const where: Record<string, any> = { mentionDate: { [Op.gte]: since } };
    if (tenantId) where.tenantId = tenantId;

    const mentions = await SocialMention.findAll({ where, raw: true });

    // Group by platform
    const byPlatform: Record<string, { positive: number; negative: number; neutral: number; total: number; avgScore: number }> = {};
    let totalPositive = 0, totalNegative = 0, totalNeutral = 0;
    let scoreSum = 0;

    for (const m of mentions) {
      const p = (m as any).platform || 'OTHER';
      if (!byPlatform[p]) byPlatform[p] = { positive: 0, negative: 0, neutral: 0, total: 0, avgScore: 0 };
      byPlatform[p].total++;
      const sentiment = (m as any).sentiment;
      if (sentiment === 'POSITIVE') { byPlatform[p].positive++; totalPositive++; }
      else if (sentiment === 'NEGATIVE') { byPlatform[p].negative++; totalNegative++; }
      else { byPlatform[p].neutral++; totalNeutral++; }
      scoreSum += Number((m as any).sentimentScore) || 0;
    }

    for (const p of Object.keys(byPlatform)) {
      const group = byPlatform[p];
      // Compute average sentiment score per platform from raw mentions
      const platformMentions = mentions.filter((m: any) => m.platform === p);
      const platformScoreSum = platformMentions.reduce((s: number, m: any) => s + (Number(m.sentimentScore) || 0), 0);
      group.avgScore = platformMentions.length > 0 ? parseFloat((platformScoreSum / platformMentions.length).toFixed(2)) : 0;
    }

    return {
      period: `${days} days`,
      totalMentions: mentions.length,
      overall: {
        positive: totalPositive,
        negative: totalNegative,
        neutral: totalNeutral,
        avgScore: mentions.length > 0 ? parseFloat((scoreSum / mentions.length).toFixed(2)) : 0
      },
      byPlatform
    };
  }

  /** Get trending keywords from recent mentions */
  async getTrendingKeywords(tenantId?: string, limit = 10) {
    const since = new Date();
    since.setDate(since.getDate() - 7);

    const where: Record<string, any> = { mentionDate: { [Op.gte]: since }, keyword: { [Op.ne]: null } };
    if (tenantId) where.tenantId = tenantId;

    const results = await SocialMention.findAll({
      where,
      attributes: ['keyword', [fn('COUNT', col('id')), 'count']],
      group: ['keyword'],
      order: [[literal('count'), 'DESC']],
      limit,
      raw: true
    });

    return results;
  }
}

export default new SocialListeningService();
