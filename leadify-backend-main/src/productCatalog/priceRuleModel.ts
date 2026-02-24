import { Column, DataType, Default, ForeignKey, BelongsTo, Model, Table } from 'sequelize-typescript';
import CatalogProduct from './productModel';

@Table({
  tableName: 'price_rules',
  modelName: 'PriceRule',
  timestamps: true
})
class PriceRule extends Model {
  @Column({ primaryKey: true, type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  public id!: string;

  @ForeignKey(() => CatalogProduct)
  @Column({ type: DataType.UUID, allowNull: false })
  public productId!: string;

  @BelongsTo(() => CatalogProduct)
  public product!: CatalogProduct;

  @Column({ type: DataType.STRING, allowNull: false })
  public name!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  public type!: string; // 'discount' | 'markup' | 'fixed'

  @Column({ type: DataType.FLOAT, allowNull: false })
  public value!: number;

  @Column({ type: DataType.JSONB, allowNull: true })
  public conditions?: object; // e.g. min quantity, date range

  @Default(true)
  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  public isActive!: boolean;
}

export default PriceRule;
