import { fn, col, literal } from 'sequelize';
import User from '../user/userModel';
import BaseError from '../utils/error/base-http-exception';
import { ERRORS } from '../utils/error/errors';
import Achievement from './achievementModel';
import UserPoints from './userPointsModel';

class GamificationService {
  async getLeaderboard(): Promise<any[]> {
    const leaderboard = await UserPoints.findAll({
      attributes: ['userId', [fn('SUM', col('points')), 'totalPoints']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'profilePicture']
        }
      ],
      group: ['UserPoints.userId', 'user.id'],
      order: [[literal('"totalPoints"'), 'DESC']],
      raw: false
    });

    return leaderboard.map((entry: unknown, index: number) => ({
      rank: index + 1,
      userId: entry.userId,
      user: entry.user,
      totalPoints: parseInt(entry.getDataValue('totalPoints') || 0)
    }));
  }

  async awardPoints(userId: number, points: number, reason: string, entityType?: string, entityId?: string): Promise<UserPoints> {
    const user = await User.findByPk(userId);
    if (!user) throw new BaseError(ERRORS.USER_NOT_FOUND);

    const userPoints = await UserPoints.create({
      userId,
      points,
      reason,
      entityType,
      entityId
    });

    return userPoints;
  }

  async getUserPoints(userId: number): Promise<unknown> {
    const user = await User.findByPk(userId);
    if (!user) throw new BaseError(ERRORS.USER_NOT_FOUND);

    const totalPoints = await UserPoints.sum('points', {
      where: { userId }
    });

    const recentPoints = await UserPoints.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: 10,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    return {
      userId,
      user,
      totalPoints: totalPoints || 0,
      recentPoints
    };
  }

  async getAchievements(): Promise<Achievement[]> {
    const achievements = await Achievement.findAll({
      order: [['pointsValue', 'DESC']]
    });
    return achievements;
  }

  async createAchievement(data: { name: string; description?: string; icon?: string; pointsValue: number; criteria?: string }): Promise<Achievement> {
    const achievement = await Achievement.create(data);
    return achievement;
  }

  async deleteAchievement(id: number): Promise<void> {
    const achievement = await Achievement.findByPk(id);
    if (!achievement) throw new BaseError(ERRORS.NOT_FOUND);

    await achievement.destroy();
  }
}

export default new GamificationService();
