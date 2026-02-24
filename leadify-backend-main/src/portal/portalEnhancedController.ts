import { Response, NextFunction } from 'express';
import { wrapResult } from '../utils/response/responseWrapper';
import portalEnhancedService from './portalEnhancedService';
import { PortalRequest } from './portalMiddleware';
import { SignatureType } from './models/signatureModel';

class PortalEnhancedController {
  /**
   * POST /api/portal/documents/:id/sign
   * Sign a document (contract) with e-signature
   */
  async signDocument(req: PortalRequest, res: Response, next: NextFunction) {
    try {
      const { signatureData, signatureType, typedName } = req.body;
      const documentId = req.params.id as string;
      const clientId = req.portalUser!.clientId;

      if (!signatureData) {
        res.status(400).json({ success: false, message: 'Signature data is required' });
        return;
      }

      if (!signatureType || !Object.values(SignatureType).includes(signatureType)) {
        res.status(400).json({ success: false, message: 'Valid signature type is required (DRAWN or TYPED)' });
        return;
      }

      if (signatureType === SignatureType.TYPED && !typedName) {
        res.status(400).json({ success: false, message: 'Typed name is required for typed signatures' });
        return;
      }

      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
      const userAgent = (req.headers['user-agent'] as string) || undefined;

      const signature = await portalEnhancedService.signDocument({
        documentId,
        clientId,
        signatureData,
        signatureType,
        typedName,
        ipAddress,
        userAgent
      });

      wrapResult(res, signature, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/portal/enhanced/dashboard
   * Get enhanced dashboard data with invoice totals, projects, signatures, documents
   */
  async getDashboard(req: PortalRequest, res: Response, next: NextFunction) {
    try {
      const clientId = req.portalUser!.clientId;
      const dashboard = await portalEnhancedService.getPortalDashboard(clientId);
      wrapResult(res, dashboard);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/portal/enhanced/invoices
   * Get client invoices with payment status and pagination
   */
  async getInvoices(req: PortalRequest, res: Response, next: NextFunction) {
    try {
      const clientId = req.portalUser!.clientId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await portalEnhancedService.getClientInvoices(clientId, { page, limit });
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/portal/enhanced/projects
   * Get client projects with progress and milestones
   */
  async getProjects(req: PortalRequest, res: Response, next: NextFunction) {
    try {
      const clientId = req.portalUser!.clientId;
      const projects = await portalEnhancedService.getClientProjects(clientId);
      wrapResult(res, projects);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/portal/enhanced/documents
   * Get documents shared with client
   */
  async getSharedDocuments(req: PortalRequest, res: Response, next: NextFunction) {
    try {
      const clientId = req.portalUser!.clientId;
      const documents = await portalEnhancedService.getSharedDocuments(clientId);
      wrapResult(res, documents);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/portal/signatures/:documentId
   * Get all signatures for a document
   */
  async getSignatures(req: PortalRequest, res: Response, next: NextFunction) {
    try {
      const { documentId } = req.params;
      const signatures = await portalEnhancedService.getDocumentSignatures(documentId as string);
      wrapResult(res, signatures);
    } catch (error) {
      next(error);
    }
  }
}

export default new PortalEnhancedController();
