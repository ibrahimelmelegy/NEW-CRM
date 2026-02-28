import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import Client from '../client/clientModel';

@Table({ tableName: 'clv_records', timestamps: true })
export default class ClvRecord extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @ForeignKey(() => Client)
  @Column({ type: DataType.UUID, allowNull: false })
  public customerId!: string;

  @BelongsTo(() => Client, { foreignKey: 'customerId', as: 'customer' })
  public customer?: Client;

  @Column({ type: DataType.DECIMAL(14, 2), allowNull: false, defaultValue: 0 })
  public historicalRevenue!: number;

  @Column({ type: DataType.DECIMAL(14, 2), allowNull: false, defaultValue: 0 })
  public predictedRevenue!: number;

  @Column({ type: DataType.FLOAT, allowNull: true })
  public churnRisk?: number; // 0-1

  @Column({ type: DataType.STRING(50), allowNull: true })
  public segment?: 'HIGH_VALUE' | 'MEDIUM_VALUE' | 'LOW_VALUE' | 'AT_RISK' | 'NEW';

  @Column({ type: DataType.DECIMAL(14, 2), allowNull: true })
  public avgOrderValue?: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  public purchaseFrequency?: number; // purchases per year

  @Column({ type: DataType.FLOAT, allowNull: true })
  public customerAge?: number; // years as customer

  @Column({ type: DataType.DATE, allowNull: true })
  public lastPurchaseDate?: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  public calculatedAt?: Date;

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;
}
