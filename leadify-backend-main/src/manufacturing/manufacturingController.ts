import { Response, NextFunction } from 'express';
import manufacturingService from './manufacturingService';
import { wrapResult } from '../utils/response/responseWrapper';
import { AuthenticatedRequest } from '../types';

class ManufacturingController {
  // BOM
  async getBOMs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await manufacturingService.getBOMs(req.user);
      return wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getBOMById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await manufacturingService.getBOMById(Number(req.params.id), req.user);
      return wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  async createBOM(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await manufacturingService.createBOM(req.body, req.user);
      return wrapResult(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  async updateBOM(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await manufacturingService.updateBOM(Number(req.params.id), req.body, req.user);
      return wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  async deleteBOM(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await manufacturingService.deleteBOM(Number(req.params.id), req.user);
      return wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  async duplicateBOM(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await manufacturingService.duplicateBOM(Number(req.params.id), req.user);
      return wrapResult(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  // Work Orders
  async getWorkOrders(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await manufacturingService.getWorkOrders(req.user, req.query);
      return wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getWorkOrderById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await manufacturingService.getWorkOrderById(Number(req.params.id), req.user);
      return wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  async createWorkOrder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await manufacturingService.createWorkOrder(req.body, req.user);
      return wrapResult(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  async updateWorkOrder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await manufacturingService.updateWorkOrder(Number(req.params.id), req.body, req.user);
      return wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  async updateProduction(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await manufacturingService.updateProduction(Number(req.params.id), req.body.produced, req.user);
      return wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  async deleteWorkOrder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await manufacturingService.deleteWorkOrder(Number(req.params.id), req.user);
      return wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  async trackProduction(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await manufacturingService.trackProduction(Number(req.params.id), req.body, req.user);
      return wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getProductionMetrics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await manufacturingService.getProductionMetrics(req.user);
      return wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getBOMCostBreakdown(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await manufacturingService.getBOMCostBreakdown(Number(req.params.id), req.user);
      return wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  // Quality Checks
  async getQualityChecks(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await manufacturingService.getQualityChecks(req.user);
      return wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  async createQualityCheck(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await manufacturingService.createQualityCheck(req.body, req.user);
      return wrapResult(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  // Stats
  async getStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await manufacturingService.getStats(req.user);
      return wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export default new ManufacturingController();
