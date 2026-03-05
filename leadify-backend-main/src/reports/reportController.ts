import { Response, NextFunction } from 'express';
import { wrapResult } from '../utils/response/responseWrapper';
import reportService from './reportService';
import reportPdfService from './pdfService';
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

  async exportExcel(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const buffer = await reportService.exportExcel(req.body);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=report.xlsx');
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  async exportPDF(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { title, data, columns, columnLabels, summary } = req.body;

      if (!data || !columns || !Array.isArray(data) || !Array.isArray(columns)) {
        res.status(400).json({ message: 'data (array) and columns (array) are required' });
        return;
      }

      const pdfBuffer = await reportPdfService.generateReportPdf({
        title: title || 'Report',
        data,
        columns,
        columnLabels,
        summary,
        orientation: columns.length > 5 ? 'landscape' : 'portrait'
      });

      const filename = title ? `${title.replace(/\s+/g, '-').toLowerCase()}.pdf` : 'report.pdf';
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  }

  async getAnalytics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { entityType, startDate, endDate } = req.query;
      if (!entityType) {
        res.status(400).json({ message: 'entityType is required' });
        return;
      }
      const analytics = await reportService.getAnalytics(entityType as string, startDate as string, endDate as string);
      wrapResult(res, analytics);
    } catch (error) {
      next(error);
    }
  }
}

export default new ReportController();
