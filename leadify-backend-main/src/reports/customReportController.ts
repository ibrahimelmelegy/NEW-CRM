import { Response, NextFunction } from 'express';
import { wrapResult } from '../utils/response/responseWrapper';
import customReportService from './customReportService';
import { AuthenticatedRequest } from '../types';

class CustomReportController {
  async getReports(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const entityType = req.query.entityType as string | undefined;
      const reports = await customReportService.getReports(req.user!.id, entityType);
      wrapResult(res, reports);
    } catch (error) {
      next(error);
    }
  }

  async getReportById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const report = await customReportService.getReportById(Number(req.params.id));
      wrapResult(res, report);
    } catch (error) {
      next(error);
    }
  }

  async createReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const report = await customReportService.createReport(req.body, req.user!.id);
      wrapResult(res, report, 201);
    } catch (error) {
      next(error);
    }
  }

  async updateReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const report = await customReportService.updateReport(
        Number(req.params.id),
        req.body,
        req.user!.id
      );
      wrapResult(res, report);
    } catch (error) {
      next(error);
    }
  }

  async deleteReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await customReportService.deleteReport(Number(req.params.id), req.user!.id);
      wrapResult(res, { deleted: true });
    } catch (error) {
      next(error);
    }
  }

  async executeReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const overrideFilters = req.body.filters;
      const data = await customReportService.executeReport(
        Number(req.params.id),
        overrideFilters
      );
      wrapResult(res, data);
    } catch (error) {
      next(error);
    }
  }

  async exportReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const format = req.params.format as string;
      const result = await customReportService.exportReport(Number(req.params.id), format);

      if (format === 'csv' || format === 'excel') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=report-${req.params.id}.csv`);
        return res.send(result);
      }

      if (format === 'pdf') {
        // Return JSON data that the frontend can use to generate a PDF
        res.setHeader('Content-Type', 'application/json');
        return res.json(result);
      }

      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getAvailableFields(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const entityType = req.params.entityType as string;
      const fields = customReportService.getAvailableFields(entityType);
      wrapResult(res, fields);
    } catch (error) {
      next(error);
    }
  }

  async getEntityTypes(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const models = customReportService.getEntityTypeModels();
      wrapResult(res, models);
    } catch (error) {
      next(error);
    }
  }
}

export default new CustomReportController();
