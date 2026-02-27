import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';

@Table({ tableName: 'wms_warehouses', timestamps: true })
export class Warehouse extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @Column({ type: DataType.STRING(200), allowNull: false })
  public name!: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public location?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public address?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public manager?: string;

  @Column({ type: DataType.INTEGER, allowNull: true })
  public capacity?: number;

  @Column({ type: DataType.INTEGER, allowNull: true, defaultValue: 0 })
  public currentOccupancy?: number;

  @Column({ type: DataType.STRING(20), allowNull: false, defaultValue: 'ACTIVE' })
  public status!: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;

  @HasMany(() => WarehouseZone, { foreignKey: 'warehouseId', as: 'zones' })
  public zones?: WarehouseZone[];
}

@Table({ tableName: 'wms_warehouse_zones', timestamps: true })
export class WarehouseZone extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  public warehouseId!: number;

  @Column({ type: DataType.STRING(100), allowNull: false })
  public name!: string;

  @Column({ type: DataType.STRING(50), allowNull: false, defaultValue: 'STORAGE' })
  public type!: 'STORAGE' | 'RECEIVING' | 'SHIPPING' | 'STAGING' | 'COLD_STORAGE';

  @Column({ type: DataType.INTEGER, allowNull: true })
  public capacity?: number;

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;
}

@Table({ tableName: 'wms_stock_transfers', timestamps: true })
export class StockTransfer extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @Column({ type: DataType.STRING(30), allowNull: false })
  public transferNumber!: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  public fromWarehouseId!: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  public toWarehouseId!: number;

  @Column({ type: DataType.JSONB, allowNull: false })
  public items!: Array<{ productId: number; productName: string; quantity: number }>;

  @Column({ type: DataType.STRING(20), allowNull: false, defaultValue: 'PENDING' })
  public status!: 'PENDING' | 'IN_TRANSIT' | 'RECEIVED' | 'CANCELLED';

  @Column({ type: DataType.TEXT, allowNull: true })
  public notes?: string;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  public shippedDate?: string;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  public receivedDate?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;
}
