import { Op } from 'sequelize';
import SocialProfile, { SocialPost } from './socialCrmModel';
import Client from '../client/clientModel';
import { clampPagination } from '../utils/pagination';

class SocialCrmService {
  async create(data: Record<string, unknown>, tenantId?: string) {
    return SocialProfile.create({ ...data, tenantId });
  }

  async getAll(query: Record<string, unknown>, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: Record<string, unknown> = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.platform) where.platform = query.platform;
    if (query.clientId) where.clientId = query.clientId;
    if (query.search) where.handle = { [Op.iLike]: `%${query.search}%` };
    try {
      const { rows, count } = await SocialProfile.findAndCountAll({
        where,
        include: [{ model: Client, as: 'client', attributes: ['id', 'clientName', 'email'], required: false }],
        order: [['createdAt', 'DESC']],
        limit,
        offset,
        distinct: true
      });
      return { docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
    } catch {
      return { docs: [], pagination: { page: 1, limit: 10, totalItems: 0, totalPages: 0 } };
    }
  }

  async update(id: number, data: Record<string, unknown>) {
    const item = await SocialProfile.findByPk(id);
    if (!item) return null;
    await item.update(data);
    return item;
  }

  async delete(id: number) {
    const item = await SocialProfile.findByPk(id);
    if (!item) return false;
    await item.destroy();
    return true;
  }

  /**
   * Calculate an engagement score for a social profile (0-100).
   * Formula: rawScore = (followers * 0.1 + likes * 1 + comments * 2 + shares * 3) / timeActiveDays
   * Then normalize to 0-100 using a logarithmic scale.
   *
   * The engagement field on the model stores aggregated interaction counts.
   * We use followers + engagement metrics and profile age for the calculation.
   */
  async calculateEngagementScore(profileId: number, metrics?: { likes?: number; comments?: number; shares?: number }) {
    const profile = await SocialProfile.findByPk(profileId);
    if (!profile) return null;

    const followers = profile.followers || 0;
    const likes = metrics?.likes || 0;
    const comments = metrics?.comments || 0;
    const shares = metrics?.shares || 0;

    // Calculate days since profile was created (minimum 1 day)
    const createdAt = profile.createdAt ? new Date(profile.createdAt) : new Date();
    const timeActiveDays = Math.max(1, Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)));

    // Raw engagement score per day
    const rawScore = (followers * 0.1 + likes * 1 + comments * 2 + shares * 3) / timeActiveDays;

    // Normalize to 0-100 using a logarithmic scale (log10(rawScore + 1) * scaling factor)
    // A rawScore of ~1000/day maps to ~100
    const normalizedScore = Math.min(100, Math.round(Math.log10(rawScore + 1) * 33.33 * 100) / 100);

    // Update the engagement field on the profile
    await profile.update({ engagement: Math.round(normalizedScore) });

    return {
      profileId,
      handle: profile.handle,
      platform: profile.platform,
      rawScore: Math.round(rawScore * 100) / 100,
      engagementScore: normalizedScore,
      metrics: { followers, likes, comments, shares, timeActiveDays }
    };
  }

  /**
   * Record a sentiment observation for a social interaction.
   * Updates the profile's sentiment field based on the new observation.
   * Tracks a running tally: if more positive than negative, overall is POSITIVE, etc.
   */
  async trackSentiment(profileId: number, sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE') {
    const profile = await SocialProfile.findByPk(profileId);
    if (!profile) return null;

    // Store sentiment history in the notes field as a lightweight JSON tally
    let tally: { positive: number; neutral: number; negative: number };
    try {
      const existing = profile.notes ? JSON.parse(profile.notes) : {};
      tally = {
        positive: existing.sentimentTally?.positive || 0,
        neutral: existing.sentimentTally?.neutral || 0,
        negative: existing.sentimentTally?.negative || 0
      };
    } catch {
      tally = { positive: 0, neutral: 0, negative: 0 };
    }

    // Increment the appropriate counter
    if (sentiment === 'POSITIVE') tally.positive++;
    else if (sentiment === 'NEGATIVE') tally.negative++;
    else tally.neutral++;

    // Determine overall sentiment
    let overallSentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' = 'NEUTRAL';
    if (tally.positive > tally.negative && tally.positive > tally.neutral) {
      overallSentiment = 'POSITIVE';
    } else if (tally.negative > tally.positive && tally.negative > tally.neutral) {
      overallSentiment = 'NEGATIVE';
    }

    const total = tally.positive + tally.neutral + tally.negative;

    // Store the tally back in notes and update the sentiment field
    let existingNotes: Record<string, unknown> = {};
    try {
      if (profile.notes) existingNotes = JSON.parse(profile.notes);
    } catch {
      /* ignore parse errors */
    }

    await profile.update({
      sentiment: overallSentiment,
      notes: JSON.stringify({ ...existingNotes, sentimentTally: tally }),
      lastActivity: new Date()
    });

    return {
      profileId,
      recordedSentiment: sentiment,
      overallSentiment,
      distribution: {
        positive: { count: tally.positive, percentage: total > 0 ? Math.round((tally.positive / total) * 10000) / 100 : 0 },
        neutral: { count: tally.neutral, percentage: total > 0 ? Math.round((tally.neutral / total) * 10000) / 100 : 0 },
        negative: { count: tally.negative, percentage: total > 0 ? Math.round((tally.negative / total) * 10000) / 100 : 0 }
      },
      totalObservations: total
    };
  }

  /**
   * Aggregated social dashboard for a tenant: total profiles, breakdown by platform,
   * average engagement score, sentiment distribution, and top performing profiles.
   */
  async getSocialDashboard(tenantId: string) {
    const profiles = await SocialProfile.findAll({ where: { tenantId } });

    // Breakdown by platform
    const byPlatform: Record<string, number> = {};
    const sentimentCounts = { POSITIVE: 0, NEUTRAL: 0, NEGATIVE: 0, UNKNOWN: 0 };
    let totalEngagement = 0;
    let engagementCount = 0;

    for (const profile of profiles) {
      // Platform counts
      byPlatform[profile.platform] = (byPlatform[profile.platform] || 0) + 1;

      // Sentiment
      if (profile.sentiment && sentimentCounts.hasOwnProperty(profile.sentiment)) {
        sentimentCounts[profile.sentiment as keyof typeof sentimentCounts]++;
      } else {
        sentimentCounts.UNKNOWN++;
      }

      // Engagement
      if (profile.engagement !== null && profile.engagement !== undefined) {
        totalEngagement += profile.engagement;
        engagementCount++;
      }
    }

    // Top performing profiles (sorted by engagement descending, top 10)
    const topProfiles = [...profiles]
      .sort((a, b) => (b.engagement || 0) - (a.engagement || 0))
      .slice(0, 10)
      .map(p => ({
        id: p.id,
        handle: p.handle,
        platform: p.platform,
        followers: p.followers,
        engagement: p.engagement,
        sentiment: p.sentiment
      }));

    return {
      totalProfiles: profiles.length,
      byPlatform,
      averageEngagement: engagementCount > 0 ? Math.round((totalEngagement / engagementCount) * 100) / 100 : 0,
      sentimentDistribution: sentimentCounts,
      topPerformingProfiles: topProfiles
    };
  }

  // ── Social Posts CRUD ─────────────────────────────────────────────────────
  async createPost(data: Record<string, unknown>, tenantId?: string) {
    return SocialPost.create({ ...data, tenantId });
  }

  async getPosts(query: Record<string, unknown>, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: Record<string, unknown> = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.status) where.status = query.status;
    const { rows, count } = await SocialPost.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });
    return { docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
  }

  async updatePost(id: number, data: Record<string, unknown>) {
    const item = await SocialPost.findByPk(id);
    if (!item) return null;
    await item.update(data);
    return item;
  }

  async deletePost(id: number) {
    const item = await SocialPost.findByPk(id);
    if (!item) return false;
    await item.destroy();
    return true;
  }

  /**
   * Get all social profiles for a specific client with their engagement metrics.
   */
  async getClientSocialPresence(clientId: string) {
    const profiles = await SocialProfile.findAll({
      where: { clientId },
      order: [['engagement', 'DESC']]
    });

    const totalFollowers = profiles.reduce((sum, p) => sum + (p.followers || 0), 0);
    const avgEngagement =
      profiles.length > 0 ? Math.round((profiles.reduce((sum, p) => sum + (p.engagement || 0), 0) / profiles.length) * 100) / 100 : 0;

    return {
      clientId,
      totalProfiles: profiles.length,
      totalFollowers,
      averageEngagement: avgEngagement,
      platforms: profiles.map(p => ({
        id: p.id,
        platform: p.platform,
        handle: p.handle,
        profileUrl: p.profileUrl,
        followers: p.followers,
        engagement: p.engagement,
        sentiment: p.sentiment,
        lastActivity: p.lastActivity
      }))
    };
  }
}
export default new SocialCrmService();
