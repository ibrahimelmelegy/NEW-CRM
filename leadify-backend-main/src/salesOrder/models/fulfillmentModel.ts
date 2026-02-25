import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import SalesOrder from './salesOrderModel';

export enum FulfillmentStatusEnum {
  PENDING = 'PENDING',
  PACKED = 'PACKED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED'
}

@Table({
  tableName: 'fulfillments',
  modelName: 'Fulfillment',
  timestamps: true
})
class Fulfillment extends Model {
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

  @Column({
    type: DataType.ENUM(...Object.values(FulfillmentStatusEnum)),
    defaultValue: FulfillmentStatusEnum.PENDING
  })
  public status!: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public trackingNumber?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public carrier?: string;

  @Column({ type: DataType.DATE, allowNull: true })
  public shippedDate?: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  public deliveredDate?: Date;

  @Column({ type: DataType.TEXT, allowNull: true })
  public notes?: string;
}

export default Fulfillment;
