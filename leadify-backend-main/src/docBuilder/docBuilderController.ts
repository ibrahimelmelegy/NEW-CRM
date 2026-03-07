import { Response, NextFunction } from 'express';
import { wrapResult } from '../utils/response/responseWrapper';
import docBuilderService from './docBuilderService';
import pdfService from './pdfService';
import { AuthenticatedRequest } from '../types';
import User from '../user/userModel';

class DocBuilderController {
  public async createDocument(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await docBuilderService.createDocument(req.body, req.user as User);
      wrapResult(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  public async getDocuments(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await docBuilderService.getDocuments(req.query, req.user as User);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async getDocumentById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await docBuilderService.getDocumentById(req.params.id as string, req.user as User);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async updateDocument(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await docBuilderService.updateDocument(req.params.id as string, req.body, req.user as User);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async deleteDocument(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await docBuilderService.deleteDocument(req.params.id as string, req.user as User);
      wrapResult(res);
    } catch (error) {
      next(error);
    }
  }

  public async changeStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await docBuilderService.changeStatus(req.params.id as string, req.body.status, req.body.reason, req.user as User);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async convertDocument(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await docBuilderService.convertDocument(req.params.id as string, req.body.targetType, req.user as User);
      wrapResult(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  public async getVersions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await docBuilderService.getVersions(req.params.id as string, req.user as User);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async getVersionById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await docBuilderService.getVersionById(req.params.id as string, req.params.versionId as string, req.user as User);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async restoreVersion(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await docBuilderService.restoreVersion(req.params.id as string, req.params.versionId as string, req.user as User);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async generatePdf(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await pdfService.generatePdf(req.params.id as string);
      wrapResult(res, { pdfUrl: result });
    } catch (error) {
      next(error);
    }
  }

  public async generateBulkPdf(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ids } = req.body;
      const result = await docBuilderService.generateBulkPdf(ids, req.user as User);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async getBrandSettings(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await docBuilderService.getBrandSettings();
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async sendDocument(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await docBuilderService.sendDocument(req.params.id as string, req.body, req.user as User);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async getStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await docBuilderService.getStats(req.query, req.user as User);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async requestApproval(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await docBuilderService.requestApproval(req.params.id as string, req.body.approverId, req.user as User);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async approveDocument(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user as User;
      const result = await docBuilderService.approveDocument(req.params.id as string, user.id, req.body.comments);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async rejectDocument(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user as User;
      const result = await docBuilderService.rejectDocument(req.params.id as string, user.id, req.body.reason);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export default new DocBuilderController();
