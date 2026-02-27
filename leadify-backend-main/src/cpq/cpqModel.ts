import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';

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

@Table({ tableName: 'sales_price_book_entries', timestamps: true })
export class PriceBookEntry extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  public priceBookId!: number;

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
