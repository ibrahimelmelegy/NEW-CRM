import { Column, DataType, Default, ForeignKey, BelongsTo, Model, Table } from 'sequelize-typescript';
import CatalogProduct from './productModel';

@Table({
  tableName: 'quote_lines',
  modelName: 'QuoteLine',
  timestamps: true
})
class QuoteLine extends Model {
  @Column({ primaryKey: true, type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  public id!: string;

  @Column({ type: DataType.UUID, allowNull: false })
  public quoteId!: string; // reference to deal/proposal

  @ForeignKey(() => CatalogProduct)
  @Column({ type: DataType.UUID, allowNull: false })
  public productId!: string;

  @BelongsTo(() => CatalogProduct)
  public product!: CatalogProduct;

  @Default(1)
  @Column({ type: DataType.FLOAT, allowNull: false, defaultValue: 1 })
  public quantity!: number;

  @Column({ type: DataType.FLOAT, allowNull: false })
  public unitPrice!: number;

  @Default(0)
  @Column({ type: DataType.FLOAT, defaultValue: 0 })
  public discount!: number;

  @Column({ type: DataType.FLOAT, allowNull: false })
  public total!: number;
}

export default QuoteLine;
