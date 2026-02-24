import { Response, NextFunction } from 'express';
import { wrapResult } from '../utils/response/responseWrapper';
import { AuthenticatedRequest } from '../types';
import gamificationService from './gamificationService';
import achievementEngine from './achievementEngine';

class GamificationController {
  public async getLeaderboard(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const leaderboard = await gamificationService.getLeaderboard();
      wrapResult(res, leaderboard);
    } catch (error) {
      next(error);
    }
  }

  public async getMyPoints(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const userPoints = await gamificationService.getUserPoints(userId);
      wrapResult(res, userPoints);
    } catch (error) {
      next(error);
    }
  }

  public async awardPoints(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId, points, reason, entityType, entityId } = req.body;
      const result = await gamificationService.awardPoints(userId, points, reason, entityType, entityId);
      wrapResult(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  public async getAchievements(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const achievements = await gamificationService.getAchievements();
      wrapResult(res, achievements);
    } catch (error) {
      next(error);
    }
  }

  public async createAchievement(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const achievement = await gamificationService.createAchievement(req.body);
      wrapResult(res, achievement, 201);
    } catch (error) {
      next(error);
    }
  }

  public async deleteAchievement(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await gamificationService.deleteAchievement(Number(req.params.id));
      wrapResult(res);
    } catch (error) {
      next(error);
    }
  }

  public async getMyAchievements(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await achievementEngine.getUserAchievements(userId);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async getChallenges(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await achievementEngine.getChallenges(userId);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export default new GamificationController();
