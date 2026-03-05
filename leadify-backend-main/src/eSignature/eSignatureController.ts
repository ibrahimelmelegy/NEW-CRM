import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { wrapResult } from '../utils/response/responseWrapper';
import service from './eSignatureService';

class ESignatureController {
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const tenantId = req.user!.tenantId!;
      wrapResult(res, await service.create(req.body, userId, tenantId), 201);
    } catch (e) {
      next(e);
    }
  }

  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await service.getAll(req.query, req.user!.tenantId!));
    } catch (e) {
      next(e);
    }
  }

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const item = await service.getById(req.params.id as string);
      if (!item) return res.status(404).send({ success: false, message: 'E-signature record not found' });
      wrapResult(res, item);
    } catch (e) {
      next(e);
    }
  }

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const item = await service.update(req.params.id as string, req.body);
      if (!item) return res.status(404).send({ success: false, message: 'E-signature record not found' });
      wrapResult(res, item);
    } catch (e) {
      next(e);
    }
  }

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const deleted = await service.delete(req.params.id as string);
      if (!deleted) return res.status(404).send({ success: false, message: 'E-signature record not found' });
      wrapResult(res, { deleted: true });
    } catch (e) {
      next(e);
    }
  }

  async sign(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).send({ success: false, message: 'Email is required' });
      const item = await service.sign(req.params.id as string, email);
      if (!item) return res.status(404).send({ success: false, message: 'Record not found or cannot be signed' });
      wrapResult(res, item);
    } catch (e) {
      next(e);
    }
  }

  async decline(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).send({ success: false, message: 'Email is required' });
      const item = await service.decline(req.params.id as string, email);
      if (!item) return res.status(404).send({ success: false, message: 'Record not found or cannot be declined' });
      wrapResult(res, item);
    } catch (e) {
      next(e);
    }
  }

  async resendReminder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await service.resendReminder(req.params.id as string);
      if (!result) return res.status(404).send({ success: false, message: 'Record not found or not pending' });
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }
}

export default new ESignatureController();
