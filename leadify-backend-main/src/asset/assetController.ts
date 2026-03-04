import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { wrapResult } from '../utils/response/responseWrapper';
import assetService from './assetService';

class AssetController {
  public async createAsset(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const responseFromService = await assetService.createAsset(req.body);
      wrapResult(res, responseFromService, 201);
    } catch (error) {
      next(error);
    }
  }

  public async updateAsset(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const responseFromService = await assetService.updateAsset(req.params.id as string, req.body);
      wrapResult(res, responseFromService);
    } catch (error) {
      next(error);
    }
  }

  public async getAssets(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const responseFromService = await assetService.getAssets(req.query);
      wrapResult(res, responseFromService);
    } catch (error) {
      next(error);
    }
  }

  public async assetById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const responseFromService = await assetService.assetById(req.params.id as string);
      wrapResult(res, responseFromService);
    } catch (error) {
      next(error);
    }
  }

  public async sendAssetsExcelByEmail(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await assetService.sendAssetsExcelByEmail(req.query, req.params.email as string);
      wrapResult(res);
    } catch (error) {
      next(error);
    }
  }

  public async deleteAsset(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await assetService.deleteAsset(req.params.id as string);
      wrapResult(res);
    } catch (error) {
      next(error);
    }
  }
}

export default new AssetController();
