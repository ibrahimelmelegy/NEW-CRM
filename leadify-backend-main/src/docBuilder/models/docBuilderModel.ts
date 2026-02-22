import { Table, Column, Model, DataType, AllowNull, Default, HasMany, BelongsTo, ForeignKey } from 'sequelize-typescript';
import User from '../../user/userModel';
import Tenant from '../../tenant/tenantModel';
import DocBuilderVersion from './docBuilderVersionModel';

export enum DocTypeEnum {
  QUOTE = 'quote',
  INVOICE = 'invoice',
  PROFORMA_INVOICE = 'proforma_invoice',
  PURCHASE_ORDER = 'purchase_order',
  CREDIT_NOTE = 'credit_note',
  CONTRACT = 'contract',
  RFQ = 'rfq',
  SALES_ORDER = 'sales_order',
  DELIVERY_NOTE = 'delivery_note',
  SLA = 'sla'
}

export enum DocStatusEnum {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SENT = 'SENT',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  ARCHIVED = 'ARCHIVED'
}

@Table({
  tableName: 'doc_builder_documents',
  modelName: 'DocBuilderDocument',
  timestamps: true,
  indexes: [
    { fields: ['type'] },
    { fields: ['status'] },
    { fields: ['reference'], unique: true },
    { fields: ['title'] },
    { fields: ['createdBy'] },
    { fields: ['parentDocumentId'] },
    { fields: ['relatedEntityId', 'relatedEntityType'] },
    { fields: ['tenantId'] }
  ]
})
class DocBuilderDocument extends Model {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4
  })
  public id!: string;

  @Column({
    type: DataType.ENUM(...Object.values(DocTypeEnum)),
    allowNull: false
  })
  public type!: DocTypeEnum;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    unique: true
  })
  public reference!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false
  })
  public title!: string;

  @Default(DocStatusEnum.DRAFT)
  @Column({
    type: DataType.ENUM(...Object.values(DocStatusEnum)),
    allowNull: false
  })
  public status!: DocStatusEnum;

  @AllowNull(true)
  @Column({ type: DataType.TEXT })
  public content?: string;

  @AllowNull(true)
  @Column({ type: DataType.STRING })
  public pdfUrl?: string;

  @Default(1)
  @Column({ type: DataType.INTEGER, allowNull: false })
  public version!: number;

  // Client info
  @AllowNull(true)
  @Column({ type: DataType.STRING(255) })
  public clientName?: string;

  @AllowNull(true)
  @Column({ type: DataType.STRING(255) })
  public clientCompany?: string;

  @AllowNull(true)
  @Column({ type: DataType.STRING(255) })
  public clientEmail?: string;

  // Financial summary
  @AllowNull(true)
  @Column({ type: DataType.DECIMAL(12, 2) })
  public subtotal?: number;

  @AllowNull(true)
  @Column({ type: DataType.DECIMAL(12, 2) })
  public discount?: number;

  @AllowNull(true)
  @Column({ type: DataType.DECIMAL(12, 2) })
  public tax?: number;

  @AllowNull(true)
  @Column({ type: DataType.DECIMAL(12, 2) })
  public total?: number;

  @Default('SAR')
  @Column({ type: DataType.STRING(3), allowNull: false })
  public currency!: string;

  // Relations to other entities
  @AllowNull(true)
  @Column({ type: DataType.UUID })
  public relatedEntityId?: string;

  @AllowNull(true)
  @Column({ type: DataType.STRING(50) })
  public relatedEntityType?: string;

  // Parent document (for conversion chain: quote -> invoice)
  @AllowNull(true)
  @ForeignKey(() => DocBuilderDocument)
  @Column({ type: DataType.UUID })
  public parentDocumentId?: string;

  @BelongsTo(() => DocBuilderDocument, { foreignKey: 'parentDocumentId', constraints: false, as: 'parentDocument' })
  public parentDocument?: DocBuilderDocument;

  @HasMany(() => DocBuilderDocument, { foreignKey: 'parentDocumentId', as: 'childDocuments' })
  public childDocuments?: DocBuilderDocument[];

  // Created by user
  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  public createdBy!: number;

  @BelongsTo(() => User, { foreignKey: 'createdBy', as: 'creator' })
  public creator?: User;

  // Meta
  @AllowNull(true)
  @Column({ type: DataType.DATE })
  public sentAt?: Date;

  @AllowNull(true)
  @Column({ type: DataType.DATE })
  public validUntil?: Date;

  @AllowNull(true)
  @Column({ type: DataType.TEXT })
  public notes?: string;

  @AllowNull(true)
  @Column({ type: DataType.ARRAY(DataType.STRING), allowNull: true })
  public tags?: string[];

  @AllowNull(true)
  @Column({ type: DataType.STRING(500) })
  public rejectionReason?: string;

  // Version history
  @HasMany(() => DocBuilderVersion, { foreignKey: 'documentId', as: 'versions' })
  public versions?: DocBuilderVersion[];

  // Multi-tenancy
  @ForeignKey(() => Tenant)
  @AllowNull(true)
  @Column({ type: DataType.UUID })
  public tenantId?: string;
}

export default DocBuilderDocument;
