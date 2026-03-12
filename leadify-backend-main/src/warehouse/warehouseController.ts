import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { wrapResult } from '../utils/response/responseWrapper';
import service from './warehouseService';

class WarehouseController {
  async createWarehouse(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await service.createWarehouse(req.body, req.user!.tenantId!), 201);
    } catch (e) {
      next(e);
    }
  }
  async getWarehouses(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await service.getWarehouses(req.query, req.user!.tenantId!));
    } catch (e) {
      next(e);
    }
  }
  async getWarehouseById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await service.getWarehouseById(Number(req.params.id)));
    } catch (e) {
      next(e);
    }
  }
  async updateWarehouse(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await service.updateWarehouse(Number(req.params.id), req.body));
    } catch (e) {
      next(e);
    }
  }
  async deleteWarehouse(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await service.deleteWarehouse(Number(req.params.id));
      wrapResult(res, { deleted: true });
    } catch (e) {
      next(e);
    }
  }
  async getZones(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await service.getZones(req.query, req.user!.tenantId!));
    } catch (e) {
      next(e);
    }
  }
  async createZone(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await service.createZone(req.body, req.user!.tenantId!), 201);
    } catch (e) {
      next(e);
    }
  }
  async deleteZone(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await service.deleteZone(Number(req.params.id));
      wrapResult(res, { deleted: true });
    } catch (e) {
      next(e);
    }
  }
  async getStockCount(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await service.getStockCount(req.user!.tenantId!));
    } catch (e) {
      next(e);
    }
  }
  async createTransfer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await service.createTransfer(req.body, req.user!.tenantId!), 201);
    } catch (e) {
      next(e);
    }
  }
  async getTransfers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await service.getTransfers(req.query, req.user!.tenantId!));
    } catch (e) {
      next(e);
    }
  }
  async updateTransfer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await service.updateTransfer(Number(req.params.id), req.body));
    } catch (e) {
      next(e);
    }
  }

  // ─── New Business Logic Endpoints ────────────────────────────────────────────

  async updateStockLevels(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const warehouseId = Number(req.params.id);
      const { items } = req.body;
      if (!items || !Array.isArray(items)) {
        return res.status(400).send({ success: false, message: 'items array is required' });
      }
      wrapResult(res, await service.updateStockLevels(warehouseId, items));
    } catch (e) {
      next(e);
    }
  }

  async processTransfer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await service.processTransfer(Number(req.params.id)));
    } catch (e) {
      next(e);
    }
  }

  async getLowStockAlerts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId!;
      const threshold = req.query.threshold ? Number(req.query.threshold) : 10;
      wrapResult(res, await service.getLowStockAlerts(tenantId, threshold));
    } catch (e) {
      next(e);
    }
  }

  async getStockSummary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await service.getStockSummary(Number(req.params.id)));
    } catch (e) {
      next(e);
    }
  }

  async pickAndPack(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const warehouseId = Number(req.params.id);
      const { items, orderId } = req.body;
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).send({ success: false, message: 'items array is required and must not be empty' });
      }
      wrapResult(res, await service.pickAndPack(warehouseId, items, orderId));
    } catch (e) {
      if ((e as Record<string, unknown>).shortages) {
        return res.status(400).send({ success: false, message: e instanceof Error ? e.message : String(e), shortages: (e as Record<string, unknown>).shortages });
      }
      next(e);
    }
  }

  async getInventoryMovement(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const warehouseId = Number(req.params.id);
      const { dateFrom, dateTo } = req.query as Record<string, string>;
      if (!dateFrom || !dateTo) {
        return res.status(400).send({ success: false, message: 'dateFrom and dateTo query params are required' });
      }
      wrapResult(res, await service.getInventoryMovement(warehouseId, dateFrom, dateTo));
    } catch (e) {
      next(e);
    }
  }
}
export default new WarehouseController();
