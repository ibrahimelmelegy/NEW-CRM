import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import UsageMeter from './usageMeterModel';

@Table({ tableName: 'usage_records', timestamps: true })
export default class UsageRecord extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @ForeignKey(() => UsageMeter)
  @Column({ type: DataType.INTEGER, allowNull: false })
  public meterId!: number;

  @BelongsTo(() => UsageMeter, { foreignKey: 'meterId', as: 'meter' })
  public meter?: UsageMeter;

  @Column({ type: DataType.UUID, allowNull: false })
  public customerId!: string;

  @Column({ type: DataType.FLOAT, allowNull: false })
  public quantity!: number;

  @Column({ type: DataType.DATE, allowNull: false })
  public recordedAt!: Date;

  @Column({ type: DataType.STRING(50), allowNull: true })
  public billingPeriod?: string; // e.g. '2026-03'

  @Column({ type: DataType.JSONB, allowNull: true })
  public metadata?: Record<string, unknown>;

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;
}
