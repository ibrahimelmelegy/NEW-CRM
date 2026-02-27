import { Column, DataType, Default, HasMany, Model, Table } from 'sequelize-typescript';
import PriceRule from './priceRuleModel';

@Table({
  tableName: 'catalog_products',
  modelName: 'CatalogProduct',
  timestamps: true
})
class CatalogProduct extends Model {
  @Column({ primaryKey: true, type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  public id!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  public name!: string;

  @Column({ type: DataType.STRING, allowNull: true, unique: true })
  public sku?: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  public description?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public category?: string;

  @Default(0)
  @Column({ type: DataType.FLOAT, allowNull: false, defaultValue: 0 })
  public unitPrice!: number;

  @Default('SAR')
  @Column({ type: DataType.STRING, defaultValue: 'SAR' })
  public currency!: string;

  @Default(true)
  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  public isActive!: boolean;

  @Column({ type: DataType.JSONB, allowNull: true })
  public metadata?: object;

  // ─── Inventory fields ─────────────────────────────────────────────────────
  @Default(0)
  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  public stockQuantity!: number;

  @Default(10)
  @Column({ type: DataType.INTEGER, defaultValue: 10 })
  public lowStockThreshold!: number;

  // ─── Media & Variants ─────────────────────────────────────────────────────
  @Column({ type: DataType.JSONB, allowNull: true, defaultValue: [] })
  public images?: string[];

  @Column({ type: DataType.JSONB, allowNull: true, defaultValue: [] })
  public variants?: object[];

  // ─── Weight / Dimensions ──────────────────────────────────────────────────
  @Column({ type: DataType.FLOAT, allowNull: true })
  public weight?: number;

  @Column({ type: DataType.STRING, allowNull: true })
  public weightUnit?: string;

  // ─── Price History (JSONB array of { price, date }) ───────────────────────
  @Column({ type: DataType.JSONB, allowNull: true, defaultValue: [] })
  public priceHistory?: object[];

  // ─── Tenant ───────────────────────────────────────────────────────────────
  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;

  @HasMany(() => PriceRule)
  public priceRules?: PriceRule[];
}

export default CatalogProduct;
