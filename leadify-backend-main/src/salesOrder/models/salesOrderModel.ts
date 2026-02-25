import { BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table } from 'sequelize-typescript';
import Client from '../../client/clientModel';
import SalesOrderItem from './salesOrderItemModel';
import Fulfillment from './fulfillmentModel';

export enum SalesOrderStatusEnum {
  DRAFT = 'DRAFT',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

@Table({
  tableName: 'sales_orders',
  modelName: 'SalesOrder',
  timestamps: true
})
class SalesOrder extends Model {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4
  })
  public id!: string;

  @Column({ type: DataType.STRING, unique: true, allowNull: false })
  public orderNumber!: string;

  @Column({
    type: DataType.ENUM(...Object.values(SalesOrderStatusEnum)),
    defaultValue: SalesOrderStatusEnum.DRAFT
  })
  public status!: string;

  @ForeignKey(() => Client)
  @Column({ type: DataType.UUID, allowNull: false })
  public clientId!: string;

  @BelongsTo(() => Client, { as: 'client' })
  public client!: Client;

  @Column({ type: DataType.UUID, allowNull: true })
  public dealId?: string;

  @Column({ type: DataType.DECIMAL(12, 2), defaultValue: 0 })
  public subtotal!: number;

  @Column({ type: DataType.DECIMAL(12, 2), defaultValue: 0 })
  public taxAmount!: number;

  @Column({ type: DataType.DECIMAL(12, 2), defaultValue: 0 })
  public discountAmount!: number;

  @Column({ type: DataType.DECIMAL(12, 2), defaultValue: 0 })
  public total!: number;

  @Column({ type: DataType.STRING, defaultValue: 'SAR' })
  public currency!: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public paymentTerms?: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  public shippingAddress?: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  public notes?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;

  @HasMany(() => SalesOrderItem, { as: 'items', onDelete: 'CASCADE' })
  public items!: SalesOrderItem[];

  @HasMany(() => Fulfillment, { as: 'fulfillments', onDelete: 'CASCADE' })
  public fulfillments!: Fulfillment[];
}

export default SalesOrder;
