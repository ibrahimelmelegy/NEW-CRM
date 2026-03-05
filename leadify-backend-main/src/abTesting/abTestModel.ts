import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({ tableName: 'mkt_ab_tests', timestamps: true })
export default class ABTest extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @Column({ type: DataType.STRING(200), allowNull: false })
  public name!: string;

  @Column({ type: DataType.STRING(50), allowNull: false, defaultValue: 'EMAIL' })
  public type!: 'EMAIL' | 'LANDING_PAGE' | 'CTA' | 'PRICING' | 'AD_COPY';

  @Column({ type: DataType.STRING(20), allowNull: false, defaultValue: 'DRAFT' })
  public status!: 'DRAFT' | 'RUNNING' | 'PAUSED' | 'COMPLETED';

  @Column({ type: DataType.JSONB, allowNull: true })
  public variants?: Array<{ name: string; description: string; traffic: number }>;

  @Column({ type: DataType.JSONB, allowNull: true })
  public results?: Record<string, any>;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  public startDate?: string;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  public endDate?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public winnerVariant?: string;

  @Column({ type: DataType.DECIMAL(5, 2), allowNull: true })
  public confidence?: number;

  @Column({ type: DataType.TEXT, allowNull: true })
  public notes?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;
}
