import { Table, Column, Model, DataType, HasMany, ForeignKey, BelongsTo } from 'sequelize-typescript';
import Client from '../client/clientModel';
import User from '../user/userModel';

// ─── Price Book ─────────────────────────────────────────────────────────────

@Table({ tableName: 'sales_price_books', timestamps: true })
export class PriceBook extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @Column({ type: DataType.STRING(200), allowNull: false })
  public name!: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  public description?: string;

  @Column({ type: DataType.STRING(3), allowNull: false, defaultValue: 'SAR' })
  public currency!: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  public isActive!: boolean;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  public effectiveDate?: string;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  public expiryDate?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;

  @HasMany(() => PriceBookEntry, { foreignKey: 'priceBookId', as: 'entries' })
  public entries?: PriceBookEntry[];
}

// ─── Price Book Entry ───────────────────────────────────────────────────────

@Table({ tableName: 'sales_price_book_entries', timestamps: true })
export class PriceBookEntry extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @ForeignKey(() => PriceBook)
  @Column({ type: DataType.INTEGER, allowNull: false })
  public priceBookId!: number;

  @BelongsTo(() => PriceBook, { foreignKey: 'priceBookId', as: 'priceBook' })
  public priceBook?: PriceBook;

  @Column({ type: DataType.STRING(200), allowNull: false })
  public productName!: string;

  @Column({ type: DataType.STRING(50), allowNull: true })
  public sku?: string;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false })
  public unitPrice!: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: true })
  public costPrice?: number;

  @Column({ type: DataType.INTEGER, allowNull: true, defaultValue: 1 })
  public minQty?: number;

  @Column({ type: DataType.DECIMAL(5, 2), allowNull: true })
  public maxDiscount?: number;

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;
}

// ─── CPQ Quote ──────────────────────────────────────────────────────────────

@Table({ tableName: 'cpq_quotes', timestamps: true })
export class CpqQuote extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @Column({ type: DataType.STRING(20), allowNull: false, unique: true })
  public quoteNumber!: string;

  @Column({ type: DataType.STRING(200), allowNull: false })
  public title!: string;

  @ForeignKey(() => Client)
  @Column({ type: DataType.UUID, allowNull: true })
  public clientId?: string;

  @BelongsTo(() => Client, { foreignKey: 'clientId', as: 'client' })
  public client?: Client;

  @Column({ type: DataType.INTEGER, allowNull: true })
  public dealId?: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  public opportunityId?: number;

  @ForeignKey(() => PriceBook)
  @Column({ type: DataType.INTEGER, allowNull: true })
  public priceBookId?: number;

  @BelongsTo(() => PriceBook, { foreignKey: 'priceBookId', as: 'priceBook' })
  public priceBookRef?: PriceBook;

  @Column({
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: []
  })
  public items!: Array<{
    productName: string;
    description?: string;
    sku?: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    total: number;
  }>;

  @Column({ type: DataType.DECIMAL(14, 2), allowNull: false, defaultValue: 0 })
  public subtotal!: number;

  @Column({ type: DataType.DECIMAL(14, 2), allowNull: false, defaultValue: 0 })
  public discountTotal!: number;

  @Column({ type: DataType.DECIMAL(5, 2), allowNull: false, defaultValue: 15 })
  public taxRate!: number;

  @Column({ type: DataType.DECIMAL(14, 2), allowNull: false, defaultValue: 0 })
  public taxAmount!: number;

  @Column({ type: DataType.DECIMAL(14, 2), allowNull: false, defaultValue: 0 })
  public total!: number;

  @Column({
    type: DataType.STRING(20),
    allowNull: false,
    defaultValue: 'DRAFT',
    validate: { isIn: [['DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'EXPIRED']] }
  })
  public status!: 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

  @Column({ type: DataType.DATEONLY, allowNull: true })
  public validUntil?: string;

  @Column({ type: DataType.STRING(3), allowNull: false, defaultValue: 'SAR' })
  public currency!: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  public notes?: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  public termsAndConditions?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: true })
  public createdBy?: number;

  @BelongsTo(() => User, { foreignKey: 'createdBy', as: 'creator' })
  public creator?: User;
}

// ─── Pricing Rule ───────────────────────────────────────────────────────────

@Table({ tableName: 'cpq_pricing_rules', timestamps: true })
export class PricingRule extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @Column({ type: DataType.STRING(200), allowNull: false })
  public name!: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: false,
    validate: { isIn: [['DISCOUNT', 'MARKUP', 'BUNDLE', 'VOLUME']] }
  })
  public type!: 'DISCOUNT' | 'MARKUP' | 'BUNDLE' | 'VOLUME';

  @Column({ type: DataType.JSONB, allowNull: true, defaultValue: {} })
  public conditions?: Record<string, any>;

  @Column({ type: DataType.DECIMAL(5, 2), allowNull: true, defaultValue: 0 })
  public discountPercent?: number;

  @Column({ type: DataType.DECIMAL(14, 2), allowNull: true, defaultValue: 0 })
  public discountAmount?: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  public minQuantity?: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  public maxQuantity?: number;

  @Column({ type: DataType.STRING(100), allowNull: true })
  public productCategory?: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  public isActive!: boolean;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  public priority!: number;

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;
}
