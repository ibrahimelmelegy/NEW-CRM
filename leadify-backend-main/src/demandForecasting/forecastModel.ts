import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import User from '../user/userModel';

@Table({ tableName: 'demand_forecasts', timestamps: true })
export default class DemandForecast extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @Column({ type: DataType.STRING(200), allowNull: false })
  public product!: string;

  @Column({ type: DataType.STRING(50), allowNull: false })
  public period!: string; // e.g. '2026-Q1', '2026-03'

  @Column({ type: DataType.FLOAT, allowNull: false })
  public predictedDemand!: number;

  @Column({ type: DataType.FLOAT, allowNull: true })
  public actualDemand?: number;

  @Column({ type: DataType.FLOAT, allowNull: true })
  public confidence?: number; // 0-1

  @Column({ type: DataType.STRING(20), allowNull: false, defaultValue: 'MOVING_AVG' })
  public method!: 'MOVING_AVG' | 'WEIGHTED_AVG' | 'EXPONENTIAL';

  @Column({ type: DataType.INTEGER, allowNull: true, defaultValue: 3 })
  public windowSize?: number;

  @Column({ type: DataType.STRING(20), allowNull: false, defaultValue: 'PENDING' })
  public status!: 'PENDING' | 'CONFIRMED' | 'EXPIRED';

  @Column({ type: DataType.JSONB, allowNull: true })
  public historicalData?: Array<{ period: string; demand: number }>;

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: true })
  public createdBy?: number;

  @BelongsTo(() => User, { foreignKey: 'createdBy', as: 'creator' })
  public creator?: User;
}
