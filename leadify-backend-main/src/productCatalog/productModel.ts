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

  @HasMany(() => PriceRule)
  public priceRules?: PriceRule[];
}

export default CatalogProduct;
