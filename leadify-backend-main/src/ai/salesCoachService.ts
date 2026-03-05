import Deal from '../deal/model/dealModel';
import { DealActivity } from '../activity-logs/model/dealActivities';
import { Op, fn, col } from 'sequelize';
import User from '../user/userModel';

interface DealCoachResult {
  dealId: string;
  dealName: string;
  winProbability: number;
  healthStatus: 'healthy' | 'at-risk' | 'stalling' | 'trending-up';
  nextBestActions: { action: string; priority: 'high' | 'medium' | 'low'; icon: string }[];
  insights: string[];
}

interface PipelineHealth {
  totalDeals: number;
  atRisk: number;
  stalling: number;
  trendingUp: number;
  healthy: number;
  avgDealAge: number;
  avgDealValue: number;
}

class SalesCoachService {
  async analyzeDeal(dealId: string): Promise<DealCoachResult> {
    const deal = await Deal.findByPk(dealId, {
      include: [{ model: User, as: 'users' }]
    });
    if (!deal) throw new Error('Deal not found');

    // Get recent activities
    const activities = await DealActivity.findAll({
      where: { dealId },
      order: [['createdAt', 'DESC']],
      limit: 20
    });

    const now = new Date();
    const dealAge = Math.floor((now.getTime() - new Date(deal.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    const lastActivity = activities[0]?.createdAt ? new Date(activities[0].createdAt) : null;
    const daysSinceActivity = lastActivity ? Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)) : 999;
    const activityCount = activities.length;

    // Calculate win probability
    const stageWeights: Record<string, number> = {
      PROGRESS: 50,
      CLOSED: 100,
      CANCELLED: 0
    };
    let winProb = stageWeights[deal.stage] || 30;

    // Activity recency bonus
    if (daysSinceActivity <= 2) winProb += 15;
    else if (daysSinceActivity <= 7) winProb += 10;
    else if (daysSinceActivity > 14) winProb -= 15;

    // Age penalty
    if (dealAge > 60) winProb -= 10;
    if (dealAge > 90) winProb -= 15;

    // Value factor (high-value deals are harder to close)
    const price = deal.price || 0;
    if (price > 100000) winProb -= 5;

    // Activity volume bonus
    if (activityCount >= 10) winProb += 10;
    else if (activityCount >= 5) winProb += 5;

    winProb = Math.max(5, Math.min(95, winProb));

    // Determine health status
    let healthStatus: DealCoachResult['healthStatus'] = 'healthy';
    if (daysSinceActivity > 14 || winProb < 30) healthStatus = 'at-risk';
    else if (daysSinceActivity > 7 && activityCount < 3) healthStatus = 'stalling';
    else if (daysSinceActivity <= 3 && activityCount >= 5) healthStatus = 'trending-up';

    // Generate next best actions
    const actions: DealCoachResult['nextBestActions'] = [];

    if (daysSinceActivity > 7) {
      actions.push({ action: 'Follow up - no activity in ' + daysSinceActivity + ' days', priority: 'high', icon: 'ph:phone-bold' });
    }
    if (activityCount < 3) {
      actions.push({ action: 'Increase engagement - only ' + activityCount + ' activities logged', priority: 'medium', icon: 'ph:chat-circle-bold' });
    }
    if (deal.stage === 'PROGRESS' && dealAge > 30) {
      actions.push({ action: 'Push for next stage - deal aging at ' + dealAge + ' days', priority: 'high', icon: 'ph:arrow-right-bold' });
    }
    if (price > 50000 && activityCount < 5) {
      actions.push({ action: 'High-value deal needs more touchpoints', priority: 'medium', icon: 'ph:star-bold' });
    }
    if (actions.length === 0) {
      actions.push({ action: 'Keep momentum - deal is on track', priority: 'low', icon: 'ph:check-circle-bold' });
    }

    // Generate insights
    const insights: string[] = [];

    // Avg deal age comparison
    const avgAge = await this.getAvgDealAge();
    if (dealAge > avgAge * 1.5) {
      insights.push(`This deal has been open ${dealAge} days - average is ${Math.round(avgAge)} days`);
    }
    if (daysSinceActivity > 7) {
      insights.push(`Last activity was ${daysSinceActivity} days ago - consider reaching out`);
    }
    if (activityCount >= 10) {
      insights.push(`Strong engagement with ${activityCount} activities logged`);
    }

    return {
      dealId: deal.id,
      dealName: deal.name,
      winProbability: Math.round(winProb),
      healthStatus,
      nextBestActions: actions,
      insights
    };
  }

  async getPipelineHealth(): Promise<PipelineHealth> {
    const deals = await Deal.findAll({
      where: { stage: 'PROGRESS' }
    });

    const now = new Date();
    let atRisk = 0;
    let stalling = 0;
    let trendingUp = 0;
    let healthy = 0;
    let totalAge = 0;
    let totalValue = 0;

    for (const deal of deals) {
      const dealAge = Math.floor((now.getTime() - new Date(deal.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      totalAge += dealAge;
      totalValue += deal.price || 0;

      const recentActivity = await DealActivity.findOne({
        where: { dealId: deal.id },
        order: [['createdAt', 'DESC']]
      });

      const daysSinceActivity = recentActivity
        ? Math.floor((now.getTime() - new Date(recentActivity.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      if (daysSinceActivity > 14) atRisk++;
      else if (daysSinceActivity > 7) stalling++;
      else if (daysSinceActivity <= 3) trendingUp++;
      else healthy++;
    }

    return {
      totalDeals: deals.length,
      atRisk,
      stalling,
      trendingUp,
      healthy,
      avgDealAge: deals.length > 0 ? Math.round(totalAge / deals.length) : 0,
      avgDealValue: deals.length > 0 ? Math.round(totalValue / deals.length) : 0
    };
  }

  async getWeeklySummary(): Promise<unknown> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const [newDeals, closedDeals, newActivities] = await Promise.all([
      Deal.count({ where: { createdAt: { [Op.gte]: oneWeekAgo } } }),
      Deal.count({ where: { stage: 'CLOSED', updatedAt: { [Op.gte]: oneWeekAgo } } }),
      DealActivity.count({ where: { createdAt: { [Op.gte]: oneWeekAgo } } })
    ]);

    return {
      period: 'Last 7 days',
      newDeals,
      closedDeals,
      totalActivities: newActivities,
      highlights: [
        newDeals > 5 ? `Great week! ${newDeals} new deals created` : `${newDeals} new deals - keep prospecting`,
        closedDeals > 0 ? `${closedDeals} deals closed this week` : 'No deals closed yet - focus on closing',
        newActivities > 20 ? `Strong activity with ${newActivities} deal interactions` : `${newActivities} activities - try to increase engagement`
      ]
    };
  }

  private async getAvgDealAge(): Promise<number> {
    const deals = await Deal.findAll({
      where: { stage: 'PROGRESS' },
      attributes: ['createdAt']
    });
    if (deals.length === 0) return 30;

    const now = new Date();
    const totalAge = deals.reduce((sum, d) => sum + Math.floor((now.getTime() - new Date(d.createdAt).getTime()) / (1000 * 60 * 60 * 24)), 0);
    return totalAge / deals.length;
  }
}

export default new SalesCoachService();
