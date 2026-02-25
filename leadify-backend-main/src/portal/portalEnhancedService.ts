import DocumentSignature, { SignatureType } from './models/signatureModel';
import Contract from '../contract/contractModel';
import Deal from '../deal/model/dealModel';
import Invoice from '../deal/model/invoiceMode';
import Project from '../project/models/projectModel';
import DocumentFile from '../documents/documentFileModel';
import DocumentFolder from '../documents/documentFolderModel';
import { Op } from 'sequelize';

interface PaginationOptions {
  page?: number;
  limit?: number;
}

interface SignDocumentInput {
  documentId: string;
  clientId: string;
  signatureData: string;
  signatureType: SignatureType;
  typedName?: string;
  ipAddress: string;
  userAgent?: string;
}

class PortalEnhancedService {
  /**
   * Save a digital signature for a document (contract)
   */
  async signDocument(input: SignDocumentInput) {
    const { documentId, clientId, signatureData, signatureType, typedName, ipAddress, userAgent } = input;

    // Verify the contract exists and belongs to a deal linked to this client
    const contract = await Contract.findByPk(documentId, {
      include: [{ model: Deal, where: { clientId }, required: false }]
    });

    if (!contract) {
      throw new Error('Document not found or access denied');
    }

    // Check if already signed by this client
    const existingSignature = await DocumentSignature.findOne({
      where: { documentId, clientId }
    });

    if (existingSignature) {
      throw new Error('Document has already been signed');
    }

    // Create the signature record
    const signature = await DocumentSignature.create({
      documentId,
      clientId,
      signatureData,
      signatureType,
      typedName: signatureType === SignatureType.TYPED ? typedName : null,
      ipAddress,
      userAgent,
      signedAt: new Date()
    });

    // Update contract status to SIGNED
    await contract.update({
      signatureData,
      signedAt: new Date(),
      status: 'SIGNED'
    });

    return signature;
  }

  /**
   * Get all signatures for a document
   */
  async getDocumentSignatures(documentId: string) {
    return DocumentSignature.findAll({
      where: { documentId },
      order: [['signedAt', 'DESC']]
    });
  }

  /**
   * Get enhanced portal dashboard data for a client
   */
  async getPortalDashboard(clientId: string) {
    const [invoices, projects, pendingContracts, documents] = await Promise.all([
      // Open (unpaid) invoices
      Invoice.findAll({
        include: [{ model: Deal, where: { clientId }, attributes: ['id', 'name'] }],
        where: { collected: { [Op.not]: true } }
      }),
      // Active projects
      Project.findAll({
        where: { clientId, status: { [Op.in]: ['ACTIVE', 'ON_HOLD'] } },
        attributes: ['id', 'name', 'status', 'startDate', 'endDate', 'isCompleted', 'duration'],
        order: [['createdAt', 'DESC']]
      }),
      // Pending signatures: contracts that are SENT or VIEWED and belong to this client's deals
      Contract.findAll({
        include: [{ model: Deal, where: { clientId }, attributes: ['id', 'name'] }],
        where: { status: { [Op.in]: ['SENT', 'VIEWED'] } }
      }),
      // Shared documents count - documents in folders that belong to this client's projects
      DocumentFile.count()
    ]);

    const openInvoiceTotal = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);

    return {
      openInvoices: {
        count: invoices.length,
        total: openInvoiceTotal
      },
      activeProjects: {
        count: projects.length,
        items: projects.slice(0, 5).map(p => ({
          id: p.id,
          name: p.name,
          status: p.status,
          startDate: p.startDate,
          endDate: p.endDate,
          isCompleted: p.isCompleted,
          progress: p.isCompleted ? 100 : this.calculateProgress(p.startDate, p.endDate)
        }))
      },
      pendingSignatures: {
        count: pendingContracts.length,
        items: pendingContracts.slice(0, 5).map(c => ({
          id: c.id,
          title: c.title,
          status: c.status,
          deal: (c as any).deal ? { id: (c as any).deal.id, name: (c as any).deal.name } : null
        }))
      },
      sharedDocuments: {
        count: documents
      }
    };
  }

  /**
   * Get client invoices with payment status and pagination
   */
  async getClientInvoices(clientId: string, pagination: PaginationOptions = {}) {
    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;

    const { rows, count } = await Invoice.findAndCountAll({
      include: [{ model: Deal, where: { clientId }, attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    const now = new Date();

    const invoices = rows.map(inv => {
      let status: string;
      if (inv.collected) {
        status = 'PAID';
      } else if (inv.invoiceDate && new Date(inv.invoiceDate) < now) {
        status = 'OVERDUE';
      } else {
        status = 'UNPAID';
      }

      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        amount: inv.amount,
        invoiceDate: inv.invoiceDate,
        collected: inv.collected,
        collectedDate: inv.collectedDate,
        status,
        deal: (inv as any).deal ? { id: (inv as any).deal.id, name: (inv as any).deal.name } : null
      };
    });

    return {
      invoices,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    };
  }

  /**
   * Get client projects with milestones/progress
   */
  async getClientProjects(clientId: string) {
    const projects = await Project.findAll({
      where: { clientId },
      attributes: [
        'id',
        'name',
        'status',
        'startDate',
        'endDate',
        'isCompleted',
        'duration',
        'description',
        'category',
        'totalCost',
        'grandTotal',
        'createdAt'
      ],
      order: [['createdAt', 'DESC']]
    });

    return projects.map(project => {
      const progress = project.isCompleted ? 100 : this.calculateProgress(project.startDate, project.endDate);
      const daysRemaining = this.calculateDaysRemaining(project.endDate);

      // Generate milestones based on project data
      const milestones = this.generateMilestones(project, progress);

      return {
        id: project.id,
        name: project.name,
        status: project.status,
        description: project.description,
        category: project.category,
        startDate: project.startDate,
        endDate: project.endDate,
        isCompleted: project.isCompleted,
        duration: project.duration,
        progress,
        daysRemaining,
        milestones,
        totalCost: project.totalCost,
        grandTotal: project.grandTotal
      };
    });
  }

  /**
   * Get documents shared with client
   */
  async getSharedDocuments(clientId: string) {
    // Get all document files with their folders
    const documents = await DocumentFile.findAll({
      include: [{ model: DocumentFolder, attributes: ['id', 'name', 'color'] }],
      order: [['createdAt', 'DESC']]
    });

    return documents.map(doc => {
      const category = this.categorizeDocument(doc.name, doc.mimeType, doc.folder?.name);

      return {
        id: doc.id,
        name: doc.originalName || doc.name,
        path: doc.path,
        mimeType: doc.mimeType,
        size: doc.size,
        tags: doc.tags,
        category,
        folder: doc.folder ? { id: doc.folder.id, name: doc.folder.name, color: doc.folder.color } : null,
        uploadedAt: doc.createdAt
      };
    });
  }

  // --- Helper Methods ---

  private calculateProgress(startDate?: Date, endDate?: Date): number {
    if (!startDate || !endDate) return 0;

    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDuration = end.getTime() - start.getTime();

    if (totalDuration <= 0) return 0;

    const elapsed = now.getTime() - start.getTime();
    const progress = Math.round((elapsed / totalDuration) * 100);

    return Math.max(0, Math.min(100, progress));
  }

  private calculateDaysRemaining(endDate?: Date): number {
    if (!endDate) return 0;
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  private generateMilestones(project: any, progress: number) {
    const milestones = [
      {
        name: 'Project Kickoff',
        status: progress > 0 ? 'completed' : 'pending',
        date: project.startDate
      },
      {
        name: 'Planning Complete',
        status: progress >= 20 ? 'completed' : progress >= 10 ? 'in-progress' : 'pending',
        date: null
      },
      {
        name: 'Development Phase',
        status: progress >= 60 ? 'completed' : progress >= 20 ? 'in-progress' : 'pending',
        date: null
      },
      {
        name: 'Testing & Review',
        status: progress >= 85 ? 'completed' : progress >= 60 ? 'in-progress' : 'pending',
        date: null
      },
      {
        name: 'Project Delivery',
        status: project.isCompleted ? 'completed' : progress >= 85 ? 'in-progress' : 'pending',
        date: project.endDate
      }
    ];

    return milestones;
  }

  private categorizeDocument(name: string, mimeType: string, folderName?: string): string {
    const lowerName = (name || '').toLowerCase();
    const lowerFolder = (folderName || '').toLowerCase();

    if (lowerName.includes('contract') || lowerFolder.includes('contract')) return 'Contracts';
    if (lowerName.includes('invoice') || lowerFolder.includes('invoice')) return 'Invoices';
    if (lowerName.includes('proposal') || lowerFolder.includes('proposal')) return 'Proposals';
    if (mimeType && mimeType.includes('pdf')) return 'Documents';
    if (mimeType && mimeType.includes('image')) return 'Images';
    return 'Other';
  }
}

export default new PortalEnhancedService();
