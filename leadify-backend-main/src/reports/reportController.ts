import { Response, NextFunction } from 'express';
import { wrapResult } from '../utils/response/responseWrapper';
import reportService from './reportService';
import { AuthenticatedRequest } from '../types';

class ReportController {
  async getReports(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const reports = await reportService.getReports(req.user!.id);
      wrapResult(res, reports);
    } catch (error) {
      next(error);
    }
  }

  async createReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const report = await reportService.createReport(req.user!.id, req.body);
      wrapResult(res, report, 201);
    } catch (error) {
      next(error);
    }
  }

  async updateReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const report = await reportService.updateReport(req.params.id as string, req.user!.id, req.body);
      wrapResult(res, report);
    } catch (error) {
      next(error);
    }
  }

  async deleteReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await reportService.deleteReport(req.params.id as string, req.user!.id);
      wrapResult(res, { deleted: true });
    } catch (error) {
      next(error);
    }
  }

  async executeReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await reportService.executeReport(req.body);
      wrapResult(res, data);
    } catch (error) {
      next(error);
    }
  }

  async exportCSV(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const csv = await reportService.exportCSV(req.body);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=report.csv');
      res.send(csv);
    } catch (error) {
      next(error);
    }
  }
}

export default new ReportController();
