import { Response, NextFunction } from 'express';
import { wrapResult } from '../utils/response/responseWrapper';
import customFieldService from './customFieldService';
import { AuthenticatedRequest } from '../types';

class CustomFieldController {
  async getFields(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { entityType } = req.params;
      const fields = await customFieldService.getFieldsByEntity(entityType as string);
      wrapResult(res, fields);
    } catch (error) {
      next(error);
    }
  }

  async createField(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const field = await customFieldService.createField(req.body);
      wrapResult(res, field, 201);
    } catch (error) {
      next(error);
    }
  }

  async updateField(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const field = await customFieldService.updateField(req.params.id as string, req.body);
      wrapResult(res, field);
    } catch (error) {
      next(error);
    }
  }

  async deleteField(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await customFieldService.deleteField(req.params.id as string);
      wrapResult(res, { deleted: true });
    } catch (error) {
      next(error);
    }
  }

  async reorderFields(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await customFieldService.reorderFields(req.body.fields);
      wrapResult(res, { reordered: true });
    } catch (error) {
      next(error);
    }
  }

  async getValues(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { entityType, entityId } = req.params;
      const values = await customFieldService.getValuesForEntity(entityId as string, entityType as string);
      wrapResult(res, values);
    } catch (error) {
      next(error);
    }
  }

  async saveValues(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { entityType, entityId } = req.params;
      const values = await customFieldService.saveValues(entityId as string, entityType as string, req.body.values);
      wrapResult(res, values);
    } catch (error) {
      next(error);
    }
  }
}

export default new CustomFieldController();
