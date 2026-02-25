import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import SalesOrder from './salesOrderModel';

@Table({
  tableName: 'sales_order_items',
  modelName: 'SalesOrderItem',
  timestamps: true
})
class SalesOrderItem extends Model {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4
  })
  public id!: string;

  @ForeignKey(() => SalesOrder)
  @Column({ type: DataType.UUID, allowNull: false })
  public salesOrderId!: string;

  @BelongsTo(() => SalesOrder, { as: 'salesOrder' })
  public salesOrder!: SalesOrder;

  @Column({ type: DataType.UUID, allowNull: true })
  public productId?: string;

  @Column({ type: DataType.STRING, allowNull: false })
  public description!: string;

  @Column({ type: DataType.DECIMAL(10, 2), defaultValue: 1 })
  public quantity!: number;

  @Column({ type: DataType.DECIMAL(12, 2), defaultValue: 0 })
  public unitPrice!: number;

  @Column({ type: DataType.DECIMAL(5, 2), defaultValue: 0 })
  public taxRate!: number;

  @Column({ type: DataType.DECIMAL(5, 2), defaultValue: 0 })
  public discountRate!: number;

  @Column({ type: DataType.DECIMAL(12, 2), defaultValue: 0 })
  public lineTotal!: number;
}

export default SalesOrderItem;
