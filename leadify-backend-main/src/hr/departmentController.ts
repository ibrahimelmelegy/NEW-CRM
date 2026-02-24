import { Response, NextFunction } from 'express';
import { wrapResult } from '../utils/response/responseWrapper';
import departmentService from './departmentService';
import { AuthenticatedRequest } from '../types';

class DepartmentController {
  async createDepartment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const department = await departmentService.createDepartment(req.body);
      wrapResult(res, department, 201);
    } catch (error) {
      next(error);
    }
  }

  async getDepartments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const departments = await departmentService.getDepartments();
      wrapResult(res, departments);
    } catch (error) {
      next(error);
    }
  }

  async getDepartmentById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const department = await departmentService.getDepartmentById(req.params.id as string);
      wrapResult(res, department);
    } catch (error) {
      next(error);
    }
  }

  async updateDepartment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const department = await departmentService.updateDepartment(req.params.id as string, req.body);
      wrapResult(res, department);
    } catch (error) {
      next(error);
    }
  }

  async deleteDepartment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await departmentService.deleteDepartment(req.params.id as string);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getDepartmentTree(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tree = await departmentService.getDepartmentTree();
      wrapResult(res, tree);
    } catch (error) {
      next(error);
    }
  }
}

export default new DepartmentController();
