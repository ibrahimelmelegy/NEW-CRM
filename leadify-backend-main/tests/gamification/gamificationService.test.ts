
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import gamificationService from '../../src/gamification/gamificationService';
import Achievement from '../../src/gamification/achievementModel';
import UserPoints from '../../src/gamification/userPointsModel';
import User from '../../src/user/userModel';
import BaseError from '../../src/utils/error/base-http-exception';
import { ERRORS } from '../../src/utils/error/errors';

// ----------------------------------------------------------------------------
// Mocks
// ----------------------------------------------------------------------------

jest.mock('../../src/gamification/achievementModel');
jest.mock('../../src/gamification/userPointsModel');
jest.mock('../../src/user/userModel');

describe('GamificationService', () => {
  const mockUser: any = { id: 1, name: 'Alice', email: 'alice@test.com' };

  const mockAchievement: any = {
    id: 1, name: 'First Deal', description: 'Close your first deal',
    icon: 'trophy', pointsValue: 100,
    destroy: jest.fn()
  };

  const mockUserPoints: any = {
    id: 1, userId: 1, points: 50, reason: 'Deal closed',
    getDataValue: jest.fn((key: string) => key === 'totalPoints' ? 150 : undefined)
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // Leaderboard
  // --------------------------------------------------------------------------
  describe('getLeaderboard', () => {
    it('should return ranked leaderboard entries', async () => {
      const entries = [
        { userId: 1, user: mockUser, getDataValue: jest.fn(() => 200) },
        { userId: 2, user: { id: 2, name: 'Bob' }, getDataValue: jest.fn(() => 100) }
      ];
      (UserPoints.findAll as jest.Mock<any>).mockResolvedValue(entries);

      const result = await gamificationService.getLeaderboard();

      expect(result).toHaveLength(2);
      expect(result[0].rank).toBe(1);
      expect(result[0].totalPoints).toBe(200);
      expect(result[1].rank).toBe(2);
    });

    it('should return empty array when no points exist', async () => {
      (UserPoints.findAll as jest.Mock<any>).mockResolvedValue([]);

      const result = await gamificationService.getLeaderboard();

      expect(result).toHaveLength(0);
    });
  });

  // --------------------------------------------------------------------------
  // Award Points
  // --------------------------------------------------------------------------
  describe('awardPoints', () => {
    it('should award points to an existing user', async () => {
      (User.findByPk as jest.Mock<any>).mockResolvedValue(mockUser);
      (UserPoints.create as jest.Mock<any>).mockResolvedValue(mockUserPoints);

      const result = await gamificationService.awardPoints(1, 50, 'Deal closed', 'deal', 'deal-1');

      expect(User.findByPk).toHaveBeenCalledWith(1);
      expect(UserPoints.create).toHaveBeenCalledWith({
        userId: 1, points: 50, reason: 'Deal closed',
        entityType: 'deal', entityId: 'deal-1'
      });
      expect(result).toBe(mockUserPoints);
    });

    it('should throw USER_NOT_FOUND when user does not exist', async () => {
      (User.findByPk as jest.Mock<any>).mockResolvedValue(null);

      await expect(gamificationService.awardPoints(999, 50, 'Test'))
        .rejects.toThrow(new BaseError(ERRORS.USER_NOT_FOUND));
    });
  });

  // --------------------------------------------------------------------------
  // User Points
  // --------------------------------------------------------------------------
  describe('getUserPoints', () => {
    it('should return total and recent points for a user', async () => {
      (User.findByPk as jest.Mock<any>).mockResolvedValue(mockUser);
      (UserPoints.sum as jest.Mock<any>).mockResolvedValue(350);
      (UserPoints.findAll as jest.Mock<any>).mockResolvedValue([mockUserPoints]);

      const result = await gamificationService.getUserPoints(1);

      expect(result.userId).toBe(1);
      expect(result.totalPoints).toBe(350);
      expect(result.recentPoints).toHaveLength(1);
    });

    it('should throw USER_NOT_FOUND when user does not exist', async () => {
      (User.findByPk as jest.Mock<any>).mockResolvedValue(null);

      await expect(gamificationService.getUserPoints(999))
        .rejects.toThrow(new BaseError(ERRORS.USER_NOT_FOUND));
    });

    it('should return totalPoints as 0 when user has no points', async () => {
      (User.findByPk as jest.Mock<any>).mockResolvedValue(mockUser);
      (UserPoints.sum as jest.Mock<any>).mockResolvedValue(null);
      (UserPoints.findAll as jest.Mock<any>).mockResolvedValue([]);

      const result = await gamificationService.getUserPoints(1);

      expect(result.totalPoints).toBe(0);
    });
  });

  // --------------------------------------------------------------------------
  // Achievements
  // --------------------------------------------------------------------------
  describe('getAchievements', () => {
    it('should return all achievements ordered by pointsValue DESC', async () => {
      (Achievement.findAll as jest.Mock<any>).mockResolvedValue([mockAchievement]);

      const result = await gamificationService.getAchievements();

      expect(Achievement.findAll).toHaveBeenCalledWith({ order: [['pointsValue', 'DESC']] });
      expect(result).toHaveLength(1);
    });
  });

  describe('createAchievement', () => {
    it('should create a new achievement', async () => {
      const data = { name: 'Top Seller', pointsValue: 500 };
      (Achievement.create as jest.Mock<any>).mockResolvedValue({ id: 2, ...data });

      const result = await gamificationService.createAchievement(data);

      expect(Achievement.create).toHaveBeenCalledWith(data);
      expect(result).toHaveProperty('id', 2);
    });
  });

  describe('deleteAchievement', () => {
    it('should delete an existing achievement', async () => {
      (Achievement.findByPk as jest.Mock<any>).mockResolvedValue(mockAchievement);

      await gamificationService.deleteAchievement(1);

      expect(mockAchievement.destroy).toHaveBeenCalled();
    });

    it('should throw NOT_FOUND when achievement does not exist', async () => {
      (Achievement.findByPk as jest.Mock<any>).mockResolvedValue(null);

      await expect(gamificationService.deleteAchievement(999))
        .rejects.toThrow(new BaseError(ERRORS.NOT_FOUND));
    });
  });
});
