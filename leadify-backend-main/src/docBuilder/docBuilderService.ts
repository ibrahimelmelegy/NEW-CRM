import { Op, WhereOptions, Includeable, fn, col } from 'sequelize';
import { clampPagination } from '../utils/pagination';
import DocBuilderDocument, { DocTypeEnum, DocStatusEnum } from './models/docBuilderModel';
import DocBuilderVersion from './models/docBuilderVersionModel';
import DocumentTemplate from '../documentTemplate/documentTemplateModel';
import Setting from '../setting/settingModel';
import BaseError from '../utils/error/base-http-exception';
import { ERRORS } from '../utils/error/errors';
import User from '../user/userModel';
import { tenantWhere, tenantCreate } from '../utils/tenantScope';
import { DocBuilderPermissionsEnum } from '../role/roleEnum';
import { SortEnum } from '../lead/leadEnum';
import { DocSortByEnum } from './inputs/getDocsInput';
import { sendEmail } from '../utils/emailHelper';
import { renderWithTemplate } from './templateRenderer';
import storageService from '../storage/storageService';
import type { BrandSettings } from './templateEngine';
import notificationCenterService from '../notification/notificationCenterService';

const REF_PREFIXES: Record<string, string> = {
  quote: 'QT',
  invoice: 'INV',
  proforma_invoice: 'PI',
  purchase_order: 'PO',
  credit_note: 'CN',
  contract: 'CTR',
  rfq: 'RFQ',
  sales_order: 'SO',
  delivery_note: 'DN',
  sla: 'SLA'
};

class DocBuilderService {
  private generateReference(type: string): string {
    const prefix = REF_PREFIXES[type] || 'DOC';
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${year}-${random}`;
  }

  public async createDocument(data: Record<string, unknown>, user: User): Promise<DocBuilderDocument> {
    if (!data.reference) {
      data.reference = this.generateReference(data.type);
      // Ensure uniqueness
      let existing = await DocBuilderDocument.findOne({ where: { reference: data.reference } });
      while (existing) {
        data.reference = this.generateReference(data.type);
        existing = await DocBuilderDocument.findOne({ where: { reference: data.reference } });
      }
    } else {
      await this.errorIfReferenceExists(data.reference);
    }

    data.createdBy = user.id;
    const docData = tenantCreate(data, user);
    const document = await DocBuilderDocument.create(docData);

    // Create initial version
    await DocBuilderVersion.create({
      documentId: document.id,
      version: 1,
      content: data.content,
      changedBy: user.id,
      changeNote: 'Initial version'
    });

    return document;
  }

  public async updateDocument(id: string, data: Record<string, unknown>, user: User): Promise<DocBuilderDocument> {
    const document = await this.documentOrError({ id, ...tenantWhere(user) });

    if (data.reference && data.reference !== document.reference) {
      await this.errorIfReferenceExists(data.reference, id);
    }

    const hasContentChange = data.content && data.content !== document.content;

    if (hasContentChange) {
      const newVersion = document.version + 1;
      data.version = newVersion;

      // Save version snapshot
      await DocBuilderVersion.create({
        documentId: document.id,
        version: newVersion,
        content: data.content,
        changedBy: user.id,
        changeNote: data.changeNote || `Version ${newVersion}`
      });
    }

    // Remove changeNote from update data (not a model field)
    delete data.changeNote;

    await document.update(data);
    return document;
  }

  public async getDocuments(query: Record<string, unknown>, user: User): Promise<unknown> {
    const { page, limit, offset } = clampPagination(query, 20);

    const where: WhereOptions = {
      ...tenantWhere(user)
    };

    // Apply ownership filter if no global view permission
    if (!user.role?.permissions?.includes(DocBuilderPermissionsEnum.VIEW_GLOBAL_DOCUMENTS)) {
      (where as any).createdBy = user.id;
    }

    // Type filter
    if (query.type) {
      const types = Array.isArray(query.type) ? query.type : [query.type];
      if (types.length > 0) (where as any).type = { [Op.in]: types };
    }

    // Status filter
    if (query.status) {
      const statuses = Array.isArray(query.status) ? query.status : [query.status];
      if (statuses.length > 0) (where as any).status = { [Op.in]: statuses };
    }

    // Search
    if (query.searchKey) {
      (where as any)[Op.or] = [
        { title: { [Op.iLike]: `%${query.searchKey}%` } },
        { reference: { [Op.iLike]: `%${query.searchKey}%` } },
        { clientName: { [Op.iLike]: `%${query.searchKey}%` } },
        { clientCompany: { [Op.iLike]: `%${query.searchKey}%` } }
      ];
    }

    // Date range
    if (query.fromDate || query.toDate) {
      (where as any).createdAt = {
        ...(query.fromDate && { [Op.gte]: new Date(query.fromDate) }),
        ...(query.toDate && { [Op.lte]: new Date(query.toDate) })
      };
    }

    // Client filter
    if (query.clientName) {
      (where as any).clientName = { [Op.iLike]: `%${query.clientName}%` };
    }

    const { rows: documents, count: totalItems } = await DocBuilderDocument.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name']
        }
      ],
      limit,
      offset,
      distinct: true,
      order: [
        [
          query.sortBy && Object.keys(DocSortByEnum).includes(query.sortBy) ? query.sortBy : 'createdAt',
          query.sort && Object.values(SortEnum).includes(query.sort) ? query.sort : SortEnum.DESC
        ]
      ],
      attributes: [
        'id',
        'type',
        'reference',
        'title',
        'status',
        'version',
        'clientName',
        'clientCompany',
        'clientEmail',
        'subtotal',
        'discount',
        'tax',
        'total',
        'currency',
        'pdfUrl',
        'sentAt',
        'validUntil',
        'createdBy',
        'createdAt',
        'updatedAt'
      ]
    });

    return {
      docs: documents,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit)
      }
    };
  }

  public async getDocumentById(id: string, user: User): Promise<DocBuilderDocument> {
    const where: WhereOptions = { id, ...tenantWhere(user) };

    if (!user.role?.permissions?.includes(DocBuilderPermissionsEnum.VIEW_GLOBAL_DOCUMENTS)) {
      (where as any).createdBy = user.id;
    }

    const document = await DocBuilderDocument.findOne({
      where,
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name'] },
        { model: User, as: 'approver', attributes: ['id', 'name'] },
        {
          model: DocBuilderVersion,
          as: 'versions',
          attributes: ['id', 'version', 'changedBy', 'changeNote', 'createdAt'],
          include: [{ model: User, as: 'editor', attributes: ['id', 'name'] }],
          order: [['version', 'DESC']],
          separate: true
        },
        { model: DocBuilderDocument, as: 'parentDocument', attributes: ['id', 'type', 'reference', 'title'] },
        { model: DocBuilderDocument, as: 'childDocuments', attributes: ['id', 'type', 'reference', 'title', 'status'] }
      ]
    });

    if (!document) throw new BaseError(ERRORS.NOT_FOUND);
    return document;
  }

  public async deleteDocument(id: string, user: User): Promise<void> {
    const document = await this.documentOrError({ id, ...tenantWhere(user) });

    // Check ownership or permission
    if (document.createdBy !== user.id) {
      const hasPermission = user.role?.permissions?.includes(DocBuilderPermissionsEnum.DELETE_DOCUMENTS);
      if (!hasPermission) throw new BaseError(ERRORS.ACCESS_DENIED, 403);
    }

    await document.update({ status: DocStatusEnum.ARCHIVED });
  }

  public async changeStatus(id: string, status: DocStatusEnum, reason: string | undefined, user: User): Promise<DocBuilderDocument> {
    const document = await this.documentOrError({ id, ...tenantWhere(user) });

    const updateData: Record<string, unknown> = { status };
    if (reason) updateData.rejectionReason = reason;
    if (status === DocStatusEnum.SENT) updateData.sentAt = new Date();

    await document.update(updateData);
    return document;
  }

  public async convertDocument(id: string, targetType: DocTypeEnum, user: User): Promise<DocBuilderDocument> {
    const source = await this.documentOrError({ id, ...tenantWhere(user) });

    let reference = this.generateReference(targetType);
    let existing = await DocBuilderDocument.findOne({ where: { reference } });
    while (existing) {
      reference = this.generateReference(targetType);
      existing = await DocBuilderDocument.findOne({ where: { reference } });
    }

    const newDoc = await DocBuilderDocument.create(
      tenantCreate(
        {
          type: targetType,
          reference,
          title: source.title,
          status: DocStatusEnum.DRAFT,
          content: source.content,
          version: 1,
          clientName: source.clientName,
          clientCompany: source.clientCompany,
          clientEmail: source.clientEmail,
          subtotal: source.subtotal,
          discount: source.discount,
          tax: source.tax,
          total: source.total,
          currency: source.currency,
          relatedEntityId: source.relatedEntityId,
          relatedEntityType: source.relatedEntityType,
          parentDocumentId: source.id,
          createdBy: user.id,
          notes: source.notes,
          tags: source.tags
        },
        user
      )
    );

    // Create initial version for converted document
    await DocBuilderVersion.create({
      documentId: newDoc.id,
      version: 1,
      content: source.content,
      changedBy: user.id,
      changeNote: `Converted from ${source.type} ${source.reference}`
    });

    return newDoc;
  }

  public async getVersions(documentId: string, user: User): Promise<DocBuilderVersion[]> {
    await this.documentOrError({ id: documentId, ...tenantWhere(user) });

    return DocBuilderVersion.findAll({
      where: { documentId },
      include: [{ model: User, as: 'editor', attributes: ['id', 'name'] }],
      order: [['version', 'DESC']]
    });
  }

  public async getVersionById(documentId: string, versionId: string, user: User): Promise<DocBuilderVersion> {
    await this.documentOrError({ id: documentId, ...tenantWhere(user) });

    const version = await DocBuilderVersion.findOne({
      where: { id: versionId, documentId },
      include: [{ model: User, as: 'editor', attributes: ['id', 'name'] }]
    });

    if (!version) throw new BaseError(ERRORS.NOT_FOUND);
    return version;
  }

  public async restoreVersion(documentId: string, versionId: string, user: User): Promise<DocBuilderDocument> {
    const document = await this.documentOrError({ id: documentId, ...tenantWhere(user) });
    const version = await DocBuilderVersion.findOne({ where: { id: versionId, documentId } });
    if (!version) throw new BaseError(ERRORS.NOT_FOUND);

    const newVersion = document.version + 1;

    // Create a new version entry for the restore
    await DocBuilderVersion.create({
      documentId,
      version: newVersion,
      content: version.content,
      changedBy: user.id,
      changeNote: `Restored from version ${version.version}`
    });

    await document.update({
      content: version.content,
      version: newVersion
    });

    return document;
  }

  public async getStats(query: Record<string, unknown>, user: User): Promise<unknown> {
    const where: WhereOptions = { ...tenantWhere(user) };

    if (!user.role?.permissions?.includes(DocBuilderPermissionsEnum.VIEW_GLOBAL_DOCUMENTS)) {
      (where as any).createdBy = user.id;
    }

    if (query.type) {
      const types = Array.isArray(query.type) ? query.type : [query.type];
      if (types.length > 0) (where as any).type = { [Op.in]: types };
    }

    // Total count and total value via SQL
    const totalResult = (await DocBuilderDocument.findOne({
      where,
      attributes: [
        [fn('COUNT', col('id')), 'total'],
        [fn('COALESCE', fn('SUM', col('total')), 0), 'totalValue']
      ],
      raw: true
    })) as any;

    // Counts grouped by status
    const byStatusRows = (await DocBuilderDocument.findAll({
      where,
      attributes: ['status', [fn('COUNT', col('id')), 'count']],
      group: ['status'],
      raw: true
    })) as any[];

    // Counts and value grouped by type
    const byTypeRows = (await DocBuilderDocument.findAll({
      where,
      attributes: ['type', [fn('COUNT', col('id')), 'count'], [fn('COALESCE', fn('SUM', col('total')), 0), 'value']],
      group: ['type'],
      raw: true
    })) as any[];

    const byStatus: Record<string, number> = {};
    for (const row of byStatusRows) {
      byStatus[row.status] = Number(row.count) || 0;
    }

    const byType: Record<string, number> = {};
    const valueByType: Record<string, number> = {};
    for (const row of byTypeRows) {
      byType[row.type] = Number(row.count) || 0;
      valueByType[row.type] = Number(row.value) || 0;
    }

    return {
      total: Number(totalResult?.total) || 0,
      byStatus,
      byType,
      totalValue: Number(totalResult?.totalValue) || 0,
      valueByType
    };
  }

  public async sendDocument(id: string, data: { to: string; subject: string; message?: string }, user: User): Promise<DocBuilderDocument> {
    const document = await this.documentOrError({ id, ...tenantWhere(user) });

    // Generate PDF if not already generated
    let pdfUrl = document.pdfUrl;
    if (!pdfUrl) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfService = require('./pdfService').default;
      pdfUrl = await pdfService.generatePdf(id);
    }

    // Build email HTML
    const typeLabel = (document.type || 'document').replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
    const emailHtml = `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7c3aed;">${typeLabel}: ${document.reference}</h2>
        <p>${data.message || `Please find attached the ${typeLabel.toLowerCase()} "${document.title}".`}</p>
        <hr style="border: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #94a3b8;">This email was sent via Leadify CRM</p>
      </div>
    `;

    // Attachment handling — download PDF from storage and attach as base64
    let attachment: { name: string; content: string } | undefined;
    if (pdfUrl) {
      try {
        const signedUrl = await storageService.getSignedUrl(pdfUrl);
        const response = await fetch(signedUrl);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const base64Content = Buffer.from(arrayBuffer).toString('base64');
          attachment = {
            name: `${document.reference || 'document'}.pdf`,
            content: base64Content
          };
        }
      } catch {
        // If PDF download fails, send email without attachment
      }
    }

    await sendEmail({
      to: data.to,
      subject: data.subject,
      text: data.message || `Please find attached the ${typeLabel.toLowerCase()} "${document.title}".`,
      html: emailHtml,
      attachment
    });

    // Update document status to SENT
    await document.update({ status: DocStatusEnum.SENT, sentAt: new Date() });

    return document;
  }

  /**
   * Load brand settings from the Settings table.
   */
  public async getBrandSettings(): Promise<BrandSettings> {
    const settings = await Setting.findOne();
    if (!settings) return {};
    return {
      companyName: settings.name || undefined,
      logo: settings.logo || undefined,
      primaryColor: settings.primaryColor || undefined,
      accentColor: settings.accentColor || undefined,
      fontFamily: settings.fontFamily || undefined,
      companyAddress: settings.companyAddress || undefined,
      companyPhone: settings.companyPhone || undefined,
      companyEmail: settings.email || undefined,
      companyTaxId: settings.companyTaxId || undefined,
      brandFooterText: settings.brandFooterText || undefined
    };
  }

  /**
   * Render a document to HTML using its template (if set) and brand settings.
   * Automatically applies a watermark for DRAFT status documents, or when
   * an explicit watermark string is provided.
   */
  public async renderDocument(document: DocBuilderDocument, watermark?: string): Promise<string> {
    let content: Record<string, unknown> = {};
    try {
      content = document.content ? JSON.parse(document.content) : {};
    } catch {
      content = {};
    }

    // Load template if document has one
    let templateHtml: string | undefined;
    if (document.templateId) {
      const template = await DocumentTemplate.findByPk(document.templateId);
      if (template?.layout) {
        templateHtml = (template.layout as any).templateHtml;
      }
    }

    // Apply watermark automatically for DRAFT status, or use explicit watermark
    const effectiveWatermark = watermark || (document.status === DocStatusEnum.DRAFT ? 'DRAFT' : undefined);

    const brand = await this.getBrandSettings();
    return renderWithTemplate(content, document.type, templateHtml, brand, effectiveWatermark);
  }

  /**
   * Generate PDFs for multiple documents at once.
   */
  public async generateBulkPdf(ids: string[], user: User): Promise<{ id: string; pdfUrl: string }[]> {
    const results: { id: string; pdfUrl: string }[] = [];
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfService = require('./pdfService').default;

    for (const id of ids) {
      try {
        const doc = await this.documentOrError({ id, ...tenantWhere(user) });
        const pdfUrl = await pdfService.generatePdf(doc.id);
        results.push({ id: doc.id, pdfUrl });
      } catch {
        // Skip documents that fail, continue with rest
        results.push({ id, pdfUrl: '' });
      }
    }

    return results;
  }

  /**
   * Request approval for a document. Sets status to PENDING_APPROVAL and notifies the approver.
   */
  public async requestApproval(documentId: string, approverId: number, user: User): Promise<DocBuilderDocument> {
    const document = await this.documentOrError({ id: documentId, ...tenantWhere(user) });

    // Validate approver exists
    const approver = await User.findByPk(approverId);
    if (!approver) throw new BaseError(ERRORS.USER_NOT_FOUND);

    // Cannot request approval from yourself
    if (approverId === user.id) throw new BaseError(ERRORS.DOC_BUILDER_INVALID_STATUS);

    await document.update({
      status: DocStatusEnum.PENDING_APPROVAL,
      approverId,
      approvalRequestedAt: new Date(),
      // Clear any previous approval/rejection data
      approvedAt: null,
      approverComments: null,
      rejectionReason: null
    });

    // Notify the approver
    await notificationCenterService.sendNotification({
      userId: approverId,
      type: 'APPROVAL_REQUESTED',
      title: 'Document Approval Requested',
      message: `${user.name || 'A user'} has requested your approval for document "${document.title}" (${document.reference}).`,
      entityType: 'document',
      entityId: document.id,
      actionUrl: `/documents/builder/${document.id}`
    });

    return document;
  }

  /**
   * Approve a document. Validates the approver matches the assigned approver.
   */
  public async approveDocument(documentId: string, approverId: number, comments?: string): Promise<DocBuilderDocument> {
    const document = await this.documentOrError({ id: documentId });

    // Validate document is pending approval
    if (document.status !== DocStatusEnum.PENDING_APPROVAL) {
      throw new BaseError(ERRORS.DOC_BUILDER_INVALID_STATUS);
    }

    // Validate the approver matches
    if (document.approverId !== approverId) {
      throw new BaseError(ERRORS.ACCESS_DENIED, 403);
    }

    await document.update({
      status: DocStatusEnum.APPROVED,
      approvedAt: new Date(),
      approverComments: comments || null
    });

    // Emit socket event
    const io = (() => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        return require('../server').io;
      } catch {
        return null;
      }
    })();
    if (io) {
      io.emit('document:approved', {
        documentId: document.id,
        reference: document.reference,
        approverId
      });
    }

    // Notify the document owner
    await notificationCenterService.sendNotification({
      userId: document.createdBy,
      type: 'PROPOSAL_APPROVED',
      title: 'Document Approved',
      message: `Your document "${document.title}" (${document.reference}) has been approved.${comments ? ` Comments: ${comments}` : ''}`,
      entityType: 'document',
      entityId: document.id,
      actionUrl: `/documents/builder/${document.id}`
    });

    return document;
  }

  /**
   * Reject a document. Validates the approver matches the assigned approver.
   */
  public async rejectDocument(documentId: string, approverId: number, reason: string): Promise<DocBuilderDocument> {
    const document = await this.documentOrError({ id: documentId });

    // Validate document is pending approval
    if (document.status !== DocStatusEnum.PENDING_APPROVAL) {
      throw new BaseError(ERRORS.DOC_BUILDER_INVALID_STATUS);
    }

    // Validate the approver matches
    if (document.approverId !== approverId) {
      throw new BaseError(ERRORS.ACCESS_DENIED, 403);
    }

    await document.update({
      status: DocStatusEnum.REJECTED,
      rejectionReason: reason
    });

    // Emit socket event
    const io = (() => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        return require('../server').io;
      } catch {
        return null;
      }
    })();
    if (io) {
      io.emit('document:rejected', {
        documentId: document.id,
        reference: document.reference,
        approverId,
        reason
      });
    }

    // Notify the document owner
    await notificationCenterService.sendNotification({
      userId: document.createdBy,
      type: 'PROPOSAL_REJECTED',
      title: 'Document Rejected',
      message: `Your document "${document.title}" (${document.reference}) has been rejected. Reason: ${reason}`,
      entityType: 'document',
      entityId: document.id,
      actionUrl: `/documents/builder/${document.id}`
    });

    return document;
  }

  private async documentOrError(filter: WhereOptions, includes?: Includeable[]): Promise<DocBuilderDocument> {
    const document = await DocBuilderDocument.findOne({ where: filter, include: includes || [] });
    if (!document) throw new BaseError(ERRORS.NOT_FOUND);
    return document;
  }

  private async errorIfReferenceExists(reference: string, excludeId?: string): Promise<void> {
    const existing = await DocBuilderDocument.findOne({
      where: { reference, ...(excludeId && { id: { [Op.ne]: excludeId } }) }
    });
    if (existing) throw new BaseError(ERRORS.REFERENCE_ALREADY_EXISTS);
  }
}

export default new DocBuilderService();
