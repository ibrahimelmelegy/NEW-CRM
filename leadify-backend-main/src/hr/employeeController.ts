import { Response, NextFunction } from 'express';
import { wrapResult } from '../utils/response/responseWrapper';
import employeeService from './employeeService';
import { AuthenticatedRequest } from '../types';

class EmployeeController {
  async createEmployee(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const employee = await employeeService.createEmployee(req.body);
      wrapResult(res, employee, 201);
    } catch (error) {
      next(error);
    }
  }

  async getEmployees(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await employeeService.getEmployees(req.query);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getEmployeeById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const employee = await employeeService.getEmployeeById(req.params.id as string);
      wrapResult(res, employee);
    } catch (error) {
      next(error);
    }
  }

  async updateEmployee(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const employee = await employeeService.updateEmployee(req.params.id as string, req.body);
      wrapResult(res, employee);
    } catch (error) {
      next(error);
    }
  }

  async getOrgChart(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tree = await employeeService.getOrgChart();
      wrapResult(res, tree);
    } catch (error) {
      next(error);
    }
  }

  async getDirectReports(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const reports = await employeeService.getDirectReports(req.params.id as string);
      wrapResult(res, reports);
    } catch (error) {
      next(error);
    }
  }

  async addDocument(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const doc = await employeeService.addDocument(req.params.id as string, req.body);
      wrapResult(res, doc, 201);
    } catch (error) {
      next(error);
    }
  }

  async getDocuments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const docs = await employeeService.getDocuments(req.params.id as string);
      wrapResult(res, docs);
    } catch (error) {
      next(error);
    }
  }

  async getExpiringDocuments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const days = req.query.days ? Number(req.query.days) : 30;
      const docs = await employeeService.getExpiringDocuments(days);
      wrapResult(res, docs);
    } catch (error) {
      next(error);
    }
  }
}

export default new EmployeeController();
