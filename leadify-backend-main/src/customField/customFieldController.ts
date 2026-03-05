import { Response, NextFunction } from 'express';
import { wrapResult } from '../utils/response/responseWrapper';
import customFieldService from './customFieldService';
import { AuthenticatedRequest } from '../types';

class CustomFieldController {
  async getFields(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { entityType } = req.params;
      const includeInactive = req.query.includeInactive === 'true';
      const fields = includeInactive
        ? await customFieldService.getAllFieldsByEntity(entityType as string)
        : await customFieldService.getFieldsByEntity(entityType as string);
      wrapResult(res, fields);
    } catch (error) {
      next(error);
    }
  }

  async getFieldById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const field = await customFieldService.getFieldById(req.params.id as string);
      wrapResult(res, field);
    } catch (error) {
      next(error);
    }
  }

  async createField(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = {
        ...req.body,
        createdBy: req.user?.id
      };
      const field = await customFieldService.createField(data);
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
      const result = await customFieldService.deleteField(req.params.id as string);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  async reorderFields(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await customFieldService.reorderFields(req.body.fields);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getValues(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { entityType, entityId } = req.params;
      const values = await customFieldService.getValuesForEntity(entityType as string, entityId as string);
      wrapResult(res, values);
    } catch (error) {
      next(error);
    }
  }

  async saveValues(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { entityType, entityId } = req.params;
      const values = await customFieldService.setFieldValues(
        entityType as string,
        entityId as string,
        req.body.values
      );
      wrapResult(res, values);
    } catch (error) {
      next(error);
    }
  }

  async deleteValues(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { entityType, entityId } = req.params;
      const result = await customFieldService.deleteFieldValues(entityType as string, entityId as string);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export default new CustomFieldController();
