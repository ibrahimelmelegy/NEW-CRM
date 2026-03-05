import { Request, Response, NextFunction } from 'express';
import { wrapResult } from '../utils/response/responseWrapper';
import documentService from './documentService';
import { AuthenticatedRequest } from '../types';

class DocumentController {
  // ==================== FOLDERS ====================

  async getFolders(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const parentId = req.query.parentId ? Number(req.query.parentId) : undefined;
      const result = await documentService.getFolders(parentId);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getFolderTree(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await documentService.getFolderTree();
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  async createFolder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await documentService.createFolder({
        ...req.body,
        createdBy: req.user!.id
      });
      wrapResult(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  async updateFolder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await documentService.updateFolder(Number(req.params.id), req.body);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  async deleteFolder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await documentService.deleteFolder(Number(req.params.id));
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  // ==================== FILES ====================

  async getFiles(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const query: any = {};
      if (req.query.folderId !== undefined) query.folderId = Number(req.query.folderId);
      if (req.query.search) query.search = req.query.search as string;
      if (req.query.tags) query.tags = req.query.tags as string;
      if (req.query.page) query.page = Number(req.query.page);
      if (req.query.limit) query.limit = Number(req.query.limit);

      const result = await documentService.getFiles(query);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getRecentFiles(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      const result = await documentService.getRecentFiles(limit);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getFileById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await documentService.getFileById(Number(req.params.id));
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  async createFile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await documentService.createFile({
        ...req.body,
        uploadedBy: req.user!.id
      });
      wrapResult(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  async updateFile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await documentService.updateFile(Number(req.params.id), req.body);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  async deleteFile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await documentService.deleteFile(Number(req.params.id));
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export default new DocumentController();
