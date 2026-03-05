import { Request, Response, NextFunction } from 'express';
import { wrapResult } from '../utils/response/responseWrapper';
import contractService from './contractService';
import { AuthenticatedRequest } from '../types';

class ContractController {
  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await contractService.getAll(req.user!.id));
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await contractService.getById(req.params.id as string));
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await contractService.create(req.user!.id, req.body), 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await contractService.update(req.params.id as string, req.user!.id, req.body));
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await contractService.delete(req.params.id as string, req.user!.id);
      wrapResult(res, { deleted: true });
    } catch (error) {
      next(error);
    }
  }

  async sendForSignature(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      wrapResult(res, await contractService.sendForSignature(req.params.id as string, req.user!.id, baseUrl));
    } catch (error) {
      next(error);
    }
  }

  // Public endpoints (no auth)
  async getByToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await contractService.getByToken(req.params.token as string));
    } catch (error) {
      next(error);
    }
  }

  async sign(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { signatureData, signerName } = req.body;
      wrapResult(res, await contractService.sign(req.params.token as string, signatureData, signerName));
    } catch (error) {
      next(error);
    }
  }
}

export default new ContractController();
