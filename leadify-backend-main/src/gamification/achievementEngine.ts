import { Op } from 'sequelize';
import UserPoints from './userPointsModel';
import Achievement from './achievementModel';
import UserStreak from './streakModel';
import Challenge from './challengeModel';
import UserChallenge from './userChallengeModel';
import Deal from '../deal/model/dealModel';
import Lead from '../lead/leadModel';
import { io } from '../server';

// Achievement definitions with auto-check criteria
const ACHIEVEMENT_DEFINITIONS = [
  // Sales Hero
  { name: 'First Blood', description: 'Close your first deal', criteria: 'deals_closed_1', category: 'sales_hero', pointsValue: 50, icon: 'ph:trophy' },
  { name: 'Deal Machine', description: 'Close 10 deals', criteria: 'deals_closed_10', category: 'sales_hero', pointsValue: 200, icon: 'ph:fire' },
  { name: 'Sales Legend', description: 'Close 50 deals', criteria: 'deals_closed_50', category: 'sales_hero', pointsValue: 500, icon: 'ph:crown' },
  // Speed Demon
  { name: 'Quick Draw', description: 'Close a deal within 7 days', criteria: 'fast_close_7', category: 'speed_demon', pointsValue: 100, icon: 'ph:lightning' },
  { name: 'Speed Runner', description: 'Create 5 leads in one day', criteria: 'leads_daily_5', category: 'speed_demon', pointsValue: 75, icon: 'ph:rocket' },
  // Streak Master
  { name: 'Getting Started', description: '3-day activity streak', criteria: 'streak_3', category: 'streak_master', pointsValue: 30, icon: 'ph:flame' },
  { name: 'On Fire', description: '7-day activity streak', criteria: 'streak_7', category: 'streak_master', pointsValue: 100, icon: 'ph:fire' },
  { name: 'Unstoppable', description: '30-day activity streak', criteria: 'streak_30', category: 'streak_master', pointsValue: 500, icon: 'ph:meteor' },
  // Team Player
  { name: 'Helping Hand', description: 'Earn 100 total points', criteria: 'points_100', category: 'team_player', pointsValue: 25, icon: 'ph:hands-clapping' },
  { name: 'Top Performer', description: 'Earn 1000 total points', criteria: 'points_1000', category: 'team_player', pointsValue: 200, icon: 'ph:medal' },
  // Deal Closer
  { name: 'Big Fish', description: 'Close a deal worth $50,000+', criteria: 'big_deal_50k', category: 'deal_closer', pointsValue: 300, icon: 'ph:money' },
  { name: 'Whale Hunter', description: 'Close a deal worth $100,000+', criteria: 'big_deal_100k', category: 'deal_closer', pointsValue: 500, icon: 'ph:star-four' }
];

class AchievementEngine {
  async seedAchievements(): Promise<void> {
    for (const def of ACHIEVEMENT_DEFINITIONS) {
      await Achievement.findOrCreate({
        where: { criteria: def.criteria },
        defaults: {
          name: def.name,
          description: def.description,
          icon: def.icon,
          pointsValue: def.pointsValue,
          criteria: def.criteria
        }
      });
    }
  }

  async checkAndAward(userId: number, eventType: string, eventData?: any): Promise<void> {
    const achievements = await Achievement.findAll();
    const userTotalPoints = (await UserPoints.sum('points', { where: { userId } })) || 0;

    for (const achievement of achievements) {
      // Check if already awarded
      const alreadyAwarded = await UserPoints.findOne({
        where: {
          userId,
          reason: `Achievement: ${achievement.name}`,
          entityType: 'achievement'
        }
      });
      if (alreadyAwarded) continue;

      const unlocked = await this.checkCriteria(userId, achievement.criteria || '', userTotalPoints, eventData);
      if (unlocked) {
        await UserPoints.create({
          userId,
          points: achievement.pointsValue,
          reason: `Achievement: ${achievement.name}`,
          entityType: 'achievement',
          entityId: String(achievement.id)
        });

        io.emit('achievement:unlocked', {
          userId,
          achievement: {
            id: achievement.id,
            name: achievement.name,
            description: achievement.description,
            icon: achievement.icon,
            pointsValue: achievement.pointsValue
          }
        });
      }
    }
  }

  private async checkCriteria(userId: number, criteria: string, totalPoints: number, eventData?: any): Promise<boolean> {
    if (criteria.startsWith('deals_closed_')) {
      const target = parseInt(criteria.split('_')[2]);
      const count = await Deal.count({ where: { stage: 'CLOSED' } });
      return count >= target;
    }

    if (criteria.startsWith('streak_')) {
      const target = parseInt(criteria.split('_')[1]);
      const streak = await UserStreak.findOne({ where: { userId } });
      return (streak?.currentStreak || 0) >= target;
    }

    if (criteria.startsWith('points_')) {
      const target = parseInt(criteria.split('_')[1]);
      return totalPoints >= target;
    }

    if (criteria.startsWith('big_deal_')) {
      const thresholdStr = criteria.split('_')[2];
      const threshold = thresholdStr === '50k' ? 50000 : 100000;
      const bigDeal = await Deal.findOne({
        where: { stage: 'CLOSED', price: { [Op.gte]: threshold } }
      });
      return !!bigDeal;
    }

    if (criteria === 'fast_close_7' && eventData?.dealId) {
      const deal = await Deal.findByPk(eventData.dealId);
      if (deal && deal.stage === 'CLOSED') {
        const age = Math.floor((new Date().getTime() - new Date(deal.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        return age <= 7;
      }
    }

    return false;
  }

  async updateStreak(userId: number): Promise<UserStreak> {
    const today = new Date().toISOString().split('T')[0];
    let streak = await UserStreak.findOne({ where: { userId } });

    if (!streak) {
      streak = await UserStreak.create({
        userId,
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: today
      });
      return streak;
    }

    if (streak.lastActivityDate === today) return streak;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (streak.lastActivityDate === yesterdayStr) {
      streak.currentStreak += 1;
    } else {
      streak.currentStreak = 1;
    }

    if (streak.currentStreak > streak.longestStreak) {
      streak.longestStreak = streak.currentStreak;
    }

    streak.lastActivityDate = today;
    await streak.save();
    return streak;
  }

  async getUserAchievements(userId: number): Promise<any> {
    const allAchievements = await Achievement.findAll();
    const awarded = await UserPoints.findAll({
      where: { userId, entityType: 'achievement' }
    });
    const awardedIds = new Set(awarded.map(a => a.entityId));

    const totalPoints = (await UserPoints.sum('points', { where: { userId } })) || 0;
    const level = Math.floor(Math.sqrt(totalPoints / 25));
    const nextLevelPoints = Math.pow(level + 1, 2) * 25;

    const streak = await UserStreak.findOne({ where: { userId } });

    return {
      achievements: allAchievements.map(a => ({
        ...a.toJSON(),
        unlocked: awardedIds.has(String(a.id)),
        unlockedAt: awarded.find(aw => aw.entityId === String(a.id))?.createdAt
      })),
      totalPoints,
      level,
      nextLevelPoints,
      progressToNextLevel: Math.round(((totalPoints - Math.pow(level, 2) * 25) / (nextLevelPoints - Math.pow(level, 2) * 25)) * 100),
      streak: {
        current: streak?.currentStreak || 0,
        longest: streak?.longestStreak || 0,
        lastActivity: streak?.lastActivityDate
      }
    };
  }

  async getChallenges(userId: number): Promise<any[]> {
    const activeChallenges = await Challenge.findAll({
      where: { isActive: true }
    });

    const results = [];
    for (const challenge of activeChallenges) {
      let userChallenge = await UserChallenge.findOne({
        where: { userId, challengeId: challenge.id }
      });

      if (!userChallenge) {
        userChallenge = await UserChallenge.create({
          userId,
          challengeId: challenge.id,
          progress: 0
        });
      }

      results.push({
        ...challenge.toJSON(),
        progress: userChallenge.progress,
        completed: userChallenge.completed,
        completedAt: userChallenge.completedAt,
        percentage: Math.min(100, Math.round((userChallenge.progress / challenge.target) * 100))
      });
    }
    return results;
  }
}

export default new AchievementEngine();
