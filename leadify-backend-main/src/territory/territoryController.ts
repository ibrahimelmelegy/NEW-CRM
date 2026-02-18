import { Response, NextFunction } from 'express';
import { wrapResult } from '../utils/response/responseWrapper';
import territoryService from './territoryService';
import { AuthenticatedRequest } from '../types';

class TerritoryController {
  public async getTerritories(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const responseFromService = await territoryService.getTerritories(req.query as any);
      wrapResult(res, responseFromService);
    } catch (error) {
      next(error);
    }
  }

  public async getTerritoryById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const responseFromService = await territoryService.getTerritoryById(req.params.id as string);
      wrapResult(res, responseFromService);
    } catch (error) {
      next(error);
    }
  }

  public async createTerritory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const responseFromService = await territoryService.createTerritory(req.body);
      wrapResult(res, responseFromService, 201);
    } catch (error) {
      next(error);
    }
  }

  public async updateTerritory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const responseFromService = await territoryService.updateTerritory(req.params.id as string, req.body);
      wrapResult(res, responseFromService);
    } catch (error) {
      next(error);
    }
  }

  public async deleteTerritory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await territoryService.deleteTerritory(req.params.id as string);
      wrapResult(res);
    } catch (error) {
      next(error);
    }
  }

  public async getTerritoryTree(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const responseFromService = await territoryService.getTerritoryTree();
      wrapResult(res, responseFromService);
    } catch (error) {
      next(error);
    }
  }
}

export default new TerritoryController();
