import { Op } from 'sequelize';
import Client from '../client/clientModel';
import Deal from '../deal/model/dealModel';
import CommActivity from '../communication/models/activityModel';
import User from '../user/userModel';

// ─── Interfaces ─────────────────────────────────────────────────────────────
export interface HealthScore {
  clientId: string;
  clientName: string;
  companyName: string;
  email: string | null;
  overallScore: number;
  engagementScore: number;
  revenueScore: number;
  activityScore: number;
  riskLevel: 'HEALTHY' | 'AT_RISK' | 'CRITICAL';
  lastActivityDate: Date | null;
  totalRevenue: number;
  activeDeals: number;
  daysSinceLastActivity: number;
  npsScore: number | null;
  assignedUsers: Array<{ id: number; name: string }>;
}

export interface CustomerSuccessDashboard {
  summary: {
    totalClients: number;
    healthy: number;
    atRisk: number;
    critical: number;
    avgHealthScore: number;
    totalRevenue: number;
    avgNps: number;
  };
  healthDistribution: Array<{ name: string; value: number; color: string }>;
  topClients: HealthScore[];
  atRiskClients: HealthScore[];
  recentActivity: unknown[];
  revenueByMonth: Array<{ month: string; revenue: number }>;
  engagementTrend: Array<{ month: string; activities: number }>;
}

class CustomerSuccessService {
  // ─── Calculate Health Score for a Single Client ─────────────────────────────
  private async calculateHealthScore(client: unknown, tenantId?: string): Promise<HealthScore> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // Get active deals for this client
    const deals = await Deal.findAll({
      where: {
        clientId: client.id,
        ...(tenantId ? { tenantId } : {})
      },
      attributes: ['id', 'price', 'stage', 'createdAt']
    });

    const activeDeals = deals.filter((d: unknown) => !['CLOSED_WON', 'CLOSED_LOST'].includes(d.stage)).length;

    const wonDeals = deals.filter((d: unknown) => d.stage === 'CLOSED_WON');
    const totalRevenue = wonDeals.reduce((sum: number, d: unknown) => sum + (d.price || 0), 0);

    // Get recent communication activities
    const recentActivities = await CommActivity.count({
      where: {
        contactId: client.id,
        contactType: 'CLIENT',
        createdAt: { [Op.gte]: thirtyDaysAgo }
      }
    });

    const totalActivities = await CommActivity.count({
      where: {
        contactId: client.id,
        contactType: 'CLIENT',
        createdAt: { [Op.gte]: ninetyDaysAgo }
      }
    });

    // Get last activity date
    const lastActivity = await CommActivity.findOne({
      where: {
        contactId: client.id,
        contactType: 'CLIENT'
      },
      order: [['createdAt', 'DESC']],
      attributes: ['createdAt']
    });

    const lastActivityDate = lastActivity?.createdAt || null;
    const daysSinceLastActivity = lastActivityDate ? Math.floor((now.getTime() - new Date(lastActivityDate).getTime()) / (1000 * 60 * 60 * 24)) : 999;

    // ─── Score Calculations ──────────────────────────────────────────────────
    // Engagement Score (0-100): Based on recent activity frequency
    let engagementScore = 0;
    if (recentActivities >= 10) engagementScore = 100;
    else if (recentActivities >= 5) engagementScore = 80;
    else if (recentActivities >= 3) engagementScore = 60;
    else if (recentActivities >= 1) engagementScore = 40;
    else if (daysSinceLastActivity < 60) engagementScore = 20;
    else engagementScore = 0;

    // Revenue Score (0-100): Based on deal value and activity
    let revenueScore = 0;
    if (totalRevenue > 100000) revenueScore = 100;
    else if (totalRevenue > 50000) revenueScore = 80;
    else if (totalRevenue > 20000) revenueScore = 60;
    else if (totalRevenue > 5000) revenueScore = 40;
    else if (totalRevenue > 0) revenueScore = 20;
    if (activeDeals > 0) revenueScore = Math.min(100, revenueScore + 15);

    // Activity Score (0-100): Based on 90-day activity and recency
    let activityScore = 0;
    if (totalActivities >= 20) activityScore = 100;
    else if (totalActivities >= 10) activityScore = 75;
    else if (totalActivities >= 5) activityScore = 50;
    else if (totalActivities >= 1) activityScore = 25;
    // Reduce score based on inactivity
    if (daysSinceLastActivity > 60) activityScore = Math.max(0, activityScore - 40);
    else if (daysSinceLastActivity > 30) activityScore = Math.max(0, activityScore - 20);

    // Overall Score: Weighted average
    const overallScore = Math.round(engagementScore * 0.35 + revenueScore * 0.35 + activityScore * 0.3);

    // Risk Level
    let riskLevel: 'HEALTHY' | 'AT_RISK' | 'CRITICAL';
    if (overallScore >= 60) riskLevel = 'HEALTHY';
    else if (overallScore >= 30) riskLevel = 'AT_RISK';
    else riskLevel = 'CRITICAL';

    // Simulated NPS score based on engagement
    const npsScore =
      overallScore >= 70
        ? Math.floor(Math.random() * 3) + 8
        : overallScore >= 40
          ? Math.floor(Math.random() * 3) + 5
          : Math.floor(Math.random() * 4) + 1;

    // Get assigned users
    const assignedUsers: Array<{ id: number; name: string }> = [];
    if (client.users && client.users.length > 0) {
      client.users.forEach((u: unknown) => {
        assignedUsers.push({ id: u.id, name: u.name });
      });
    }

    return {
      clientId: client.id,
      clientName: client.clientName,
      companyName: client.companyName || '',
      email: client.email || null,
      overallScore,
      engagementScore,
      revenueScore,
      activityScore,
      riskLevel,
      lastActivityDate,
      totalRevenue,
      activeDeals,
      daysSinceLastActivity,
      npsScore,
      assignedUsers
    };
  }

  // ─── Get Full Customer Success Dashboard ────────────────────────────────────
  public async getDashboard(tenantId?: string): Promise<CustomerSuccessDashboard> {
    const where: Record<string, unknown> = {};
    if (tenantId) where.tenantId = tenantId;

    // Get all active clients
    const clients = await Client.findAll({
      where: {
        ...where,
        clientStatus: { [Op.ne]: 'INACTIVE' }
      },
      include: [
        {
          model: User,
          as: 'users',
          attributes: ['id', 'name'],
          through: { attributes: [] }
        }
      ],
      attributes: ['id', 'clientName', 'companyName', 'email', 'clientStatus', 'createdAt'],
      limit: 200
    });

    // Calculate health scores for all clients
    const healthScores: HealthScore[] = [];
    for (const client of clients) {
      const score = await this.calculateHealthScore(client, tenantId);
      healthScores.push(score);
    }

    // Sort by overall score
    healthScores.sort((a, b) => b.overallScore - a.overallScore);

    const healthy = healthScores.filter(h => h.riskLevel === 'HEALTHY').length;
    const atRisk = healthScores.filter(h => h.riskLevel === 'AT_RISK').length;
    const critical = healthScores.filter(h => h.riskLevel === 'CRITICAL').length;
    const avgScore = healthScores.length > 0 ? Math.round(healthScores.reduce((s, h) => s + h.overallScore, 0) / healthScores.length) : 0;
    const totalRevenue = healthScores.reduce((s, h) => s + h.totalRevenue, 0);
    const avgNps = healthScores.length > 0 ? +(healthScores.reduce((s, h) => s + (h.npsScore || 0), 0) / healthScores.length).toFixed(1) : 0;

    // Revenue by month (last 6 months)
    const revenueByMonth = await this.getRevenueByMonth(tenantId);

    // Engagement trend (last 6 months)
    const engagementTrend = await this.getEngagementTrend(tenantId);

    // Recent activities across all clients
    const recentActivity = await CommActivity.findAll({
      where: {
        contactType: 'CLIENT',
        ...(tenantId ? { tenantId } : {})
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'profilePicture']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    return {
      summary: {
        totalClients: healthScores.length,
        healthy,
        atRisk,
        critical,
        avgHealthScore: avgScore,
        totalRevenue,
        avgNps
      },
      healthDistribution: [
        { name: 'Healthy', value: healthy, color: '#10B981' },
        { name: 'At Risk', value: atRisk, color: '#F59E0B' },
        { name: 'Critical', value: critical, color: '#EF4444' }
      ],
      topClients: healthScores.slice(0, 10),
      atRiskClients: healthScores
        .filter(h => h.riskLevel !== 'HEALTHY')
        .sort((a, b) => a.overallScore - b.overallScore)
        .slice(0, 10),
      recentActivity: recentActivity.map((a: unknown) => a.toJSON()),
      revenueByMonth,
      engagementTrend
    };
  }

  // ─── Get Single Client Health Detail ────────────────────────────────────────
  public async getClientHealth(clientId: string, tenantId?: string): Promise<HealthScore | null> {
    const client = await Client.findByPk(clientId, {
      include: [
        {
          model: User,
          as: 'users',
          attributes: ['id', 'name'],
          through: { attributes: [] }
        }
      ]
    });

    if (!client) return null;
    return this.calculateHealthScore(client, tenantId);
  }

  // ─── Revenue By Month (last 6 months) ──────────────────────────────────────
  private async getRevenueByMonth(tenantId?: string): Promise<Array<{ month: string; revenue: number }>> {
    const months: Array<{ month: string; revenue: number }> = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);
      const monthName = date.toLocaleString('en', { month: 'short', year: '2-digit' });

      const where: Record<string, unknown> = {
        stage: 'CLOSED_WON',
        updatedAt: { [Op.gte]: date, [Op.lt]: nextMonth }
      };
      if (tenantId) where.tenantId = tenantId;

      const result = (await Deal.sum('price', { where })) || 0;
      months.push({ month: monthName, revenue: result });
    }

    return months;
  }

  // ─── Engagement Trend (last 6 months) ──────────────────────────────────────
  private async getEngagementTrend(tenantId?: string): Promise<Array<{ month: string; activities: number }>> {
    const months: Array<{ month: string; activities: number }> = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);
      const monthName = date.toLocaleString('en', { month: 'short', year: '2-digit' });

      const where: Record<string, unknown> = {
        contactType: 'CLIENT',
        createdAt: { [Op.gte]: date, [Op.lt]: nextMonth }
      };
      if (tenantId) where.tenantId = tenantId;

      const count = await CommActivity.count({ where });
      months.push({ month: monthName, activities: count });
    }

    return months;
  }
}

export default new CustomerSuccessService();
