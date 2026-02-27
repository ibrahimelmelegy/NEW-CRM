import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({ tableName: 'as_shipments', timestamps: true })
export class Shipment extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @Column({ type: DataType.STRING(50), allowNull: false })
  public shipmentNumber!: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public orderId?: string;

  @Column({ type: DataType.STRING(100), allowNull: true })
  public carrier?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public trackingNumber?: string;

  @Column({ type: DataType.STRING(20), allowNull: false, defaultValue: 'PREPARING' })
  public status!: 'PREPARING' | 'SHIPPED' | 'IN_TRANSIT' | 'DELIVERED' | 'RETURNED' | 'CANCELLED';

  @Column({ type: DataType.STRING, allowNull: true })
  public origin?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public destination?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public recipientName?: string;

  @Column({ type: DataType.DECIMAL(8, 2), allowNull: true })
  public weight?: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: true })
  public shippingCost?: number;

  @Column({ type: DataType.DATE, allowNull: true })
  public estimatedDelivery?: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  public actualDelivery?: Date;

  @Column({ type: DataType.TEXT, allowNull: true })
  public notes?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;
}

@Table({ tableName: 'as_shipping_rates', timestamps: true })
export class ShippingRate extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @Column({ type: DataType.STRING(100), allowNull: false })
  public carrier!: string;

  @Column({ type: DataType.STRING(50), allowNull: true })
  public zone?: string;

  @Column({ type: DataType.DECIMAL(8, 2), allowNull: false, defaultValue: 0 })
  public weightMin!: number;

  @Column({ type: DataType.DECIMAL(8, 2), allowNull: false, defaultValue: 999 })
  public weightMax!: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false })
  public rate!: number;

  @Column({ type: DataType.STRING(3), allowNull: false, defaultValue: 'SAR' })
  public currency!: string;

  @Column({ type: DataType.INTEGER, allowNull: true })
  public estimatedDays?: number;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  public isActive!: boolean;

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;
}
