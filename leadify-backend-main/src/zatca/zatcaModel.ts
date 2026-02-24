import { Column, DataType, Default, Index, Model, Table } from 'sequelize-typescript';

export interface ZatcaAddress {
  street: string;
  city: string;
  district: string;
  postalCode: string;
  country: string;
  buildingNumber: string;
  additionalNumber?: string;
}

export interface ZatcaLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxCategory: string;
  taxRate: number;
  taxAmount: number;
  lineTotal: number;
}

@Table({
  tableName: 'zatca_invoices',
  modelName: 'ZatcaInvoice',
  timestamps: true
})
class ZatcaInvoice extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @Index
  @Column({ type: DataType.STRING(100), allowNull: false })
  public invoiceId!: string;

  @Column({
    type: DataType.ENUM('STANDARD', 'SIMPLIFIED', 'DEBIT_NOTE', 'CREDIT_NOTE'),
    allowNull: false
  })
  public invoiceType!: string;

  @Index
  @Column({ type: DataType.STRING(100), allowNull: false, unique: true })
  public invoiceNumber!: string;

  @Index
  @Column({ type: DataType.DATEONLY, allowNull: false })
  public issueDate!: string;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  public supplyDate?: string;

  @Column({ type: DataType.STRING(500), allowNull: false })
  public sellerName!: string;

  @Index
  @Column({ type: DataType.STRING(15), allowNull: false })
  public sellerVatNumber!: string;

  @Column({ type: DataType.JSONB, allowNull: false })
  public sellerAddress!: ZatcaAddress;

  @Column({ type: DataType.STRING(500), allowNull: false })
  public buyerName!: string;

  @Column({ type: DataType.STRING(15), allowNull: true })
  public buyerVatNumber?: string;

  @Column({ type: DataType.JSONB, allowNull: true })
  public buyerAddress?: ZatcaAddress;

  @Column({ type: DataType.JSONB, allowNull: false })
  public lineItems!: ZatcaLineItem[];

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false })
  public subtotal!: number;

  @Default(0)
  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false, defaultValue: 0 })
  public totalDiscount!: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false })
  public totalTaxableAmount!: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false })
  public totalVat!: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false })
  public totalAmount!: number;

  @Column({ type: DataType.TEXT, allowNull: true })
  public qrCode?: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  public xmlContent?: string;

  @Column({ type: DataType.UUID, allowNull: true, defaultValue: DataType.UUIDV4 })
  public uuid!: string;

  @Column({ type: DataType.STRING(256), allowNull: true })
  public previousInvoiceHash?: string;

  @Column({ type: DataType.STRING(256), allowNull: true })
  public invoiceHash?: string;

  @Index
  @Default('DRAFT')
  @Column({
    type: DataType.ENUM('DRAFT', 'PENDING', 'REPORTED', 'CLEARED', 'REJECTED'),
    allowNull: false,
    defaultValue: 'DRAFT'
  })
  public status!: string;

  @Column({ type: DataType.JSONB, allowNull: true })
  public zatcaResponse?: Record<string, any>;

  @Column({ type: DataType.DATE, allowNull: true })
  public submittedAt?: Date;
}

export default ZatcaInvoice;
