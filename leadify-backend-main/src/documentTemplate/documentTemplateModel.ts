import { BelongsTo, Column, DataType, Default, ForeignKey, Model, Table, AllowNull } from 'sequelize-typescript';
import User from '../user/userModel';
import Tenant from '../tenant/tenantModel';

export enum DocumentTemplateType {
  INVOICE = 'INVOICE',
  QUOTE = 'QUOTE',
  CONTRACT = 'CONTRACT',
  PURCHASE_ORDER = 'PURCHASE_ORDER',
  SALES_ORDER = 'SALES_ORDER',
  DELIVERY_NOTE = 'DELIVERY_NOTE',
  CREDIT_NOTE = 'CREDIT_NOTE',
  PROFORMA_INVOICE = 'PROFORMA_INVOICE',
  RFQ = 'RFQ',
  SLA = 'SLA',
  PROPOSAL = 'PROPOSAL',
  GENERIC = 'GENERIC',
  EMAIL = 'EMAIL'
}

export interface TemplateElement {
  id: string;
  type: 'text' | 'image' | 'table' | 'line' | 'shape';
  x: number;
  y: number;
  width: number;
  height: number;
  props: Record<string, unknown>;
}

export interface TemplateLayout {
  pageSize: string;
  orientation: 'portrait' | 'landscape';
  margins: { top: number; right: number; bottom: number; left: number };
  elements: TemplateElement[];
  variables: string[];
}

@Table({
  tableName: 'document_templates',
  modelName: 'DocumentTemplate',
  timestamps: true
})
class DocumentTemplate extends Model {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4
  })
  public id!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false
  })
  public name!: string;

  @Column({
    type: DataType.ENUM(...Object.values(DocumentTemplateType)),
    allowNull: false
  })
  public type!: DocumentTemplateType;

  @Column({
    type: DataType.JSONB,
    allowNull: true
  })
  public layout?: TemplateLayout;

  @Column({
    type: DataType.JSONB,
    allowNull: true
  })
  public headerConfig?: Record<string, unknown>;

  @Column({
    type: DataType.JSONB,
    allowNull: true
  })
  public footerConfig?: Record<string, unknown>;

  @Column({
    type: DataType.JSONB,
    allowNull: true
  })
  public tableConfig?: Record<string, unknown>;

  @Default(false)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false
  })
  public isDefault!: boolean;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: true
  })
  public userId?: number;

  @BelongsTo(() => User, { as: 'user' })
  public user?: User;

  @Default('custom')
  @Column({
    type: DataType.ENUM('system', 'custom'),
    allowNull: false
  })
  public category!: 'system' | 'custom';

  // ── Email template fields ──────────────────────────────────────────────
  @AllowNull(true)
  @Column({ type: DataType.STRING(255) })
  public subject?: string;

  @AllowNull(true)
  @Column({ type: DataType.TEXT })
  public emailBody?: string;

  @AllowNull(true)
  @Column({ type: DataType.STRING(100) })
  public emailCategory?: string;

  @Default(0)
  @AllowNull(true)
  @Column({ type: DataType.INTEGER })
  public usageCount?: number;

  @ForeignKey(() => Tenant)
  @AllowNull(true)
  @Column({ type: DataType.UUID })
  public tenantId?: string;
}

export default DocumentTemplate;
