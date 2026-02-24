import { Request, Response, NextFunction } from 'express';
import manufacturingService from './manufacturingService';
import { wrapResult } from '../utils/response/responseWrapper';

class ManufacturingController {
  // BOM
  async getBOMs(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await manufacturingService.getBOMs((req as any).user);
      return wrapResult(res, result);
    } catch (error) { next(error); }
  }

  async getBOMById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await manufacturingService.getBOMById(Number(req.params.id), (req as any).user);
      return wrapResult(res, result);
    } catch (error) { next(error); }
  }

  async createBOM(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await manufacturingService.createBOM(req.body, (req as any).user);
      return wrapResult(res, result, 201);
    } catch (error) { next(error); }
  }

  async updateBOM(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await manufacturingService.updateBOM(Number(req.params.id), req.body, (req as any).user);
      return wrapResult(res, result);
    } catch (error) { next(error); }
  }

  async deleteBOM(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await manufacturingService.deleteBOM(Number(req.params.id), (req as any).user);
      return wrapResult(res, result);
    } catch (error) { next(error); }
  }

  async duplicateBOM(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await manufacturingService.duplicateBOM(Number(req.params.id), (req as any).user);
      return wrapResult(res, result, 201);
    } catch (error) { next(error); }
  }

  // Work Orders
  async getWorkOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await manufacturingService.getWorkOrders((req as any).user, req.query);
      return wrapResult(res, result);
    } catch (error) { next(error); }
  }

  async getWorkOrderById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await manufacturingService.getWorkOrderById(Number(req.params.id), (req as any).user);
      return wrapResult(res, result);
    } catch (error) { next(error); }
  }

  async createWorkOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await manufacturingService.createWorkOrder(req.body, (req as any).user);
      return wrapResult(res, result, 201);
    } catch (error) { next(error); }
  }

  async updateWorkOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await manufacturingService.updateWorkOrder(Number(req.params.id), req.body, (req as any).user);
      return wrapResult(res, result);
    } catch (error) { next(error); }
  }

  async updateProduction(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await manufacturingService.updateProduction(Number(req.params.id), req.body.produced, (req as any).user);
      return wrapResult(res, result);
    } catch (error) { next(error); }
  }

  // Quality Checks
  async getQualityChecks(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await manufacturingService.getQualityChecks((req as any).user);
      return wrapResult(res, result);
    } catch (error) { next(error); }
  }

  async createQualityCheck(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await manufacturingService.createQualityCheck(req.body, (req as any).user);
      return wrapResult(res, result, 201);
    } catch (error) { next(error); }
  }

  // Stats
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await manufacturingService.getStats((req as any).user);
      return wrapResult(res, result);
    } catch (error) { next(error); }
  }
}

export default new ManufacturingController();
