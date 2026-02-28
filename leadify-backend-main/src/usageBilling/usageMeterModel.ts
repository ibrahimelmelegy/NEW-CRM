import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({ tableName: 'usage_meters', timestamps: true })
export default class UsageMeter extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @Column({ type: DataType.STRING(200), allowNull: false })
  public name!: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  public description?: string;

  @Column({ type: DataType.STRING(50), allowNull: false })
  public unit!: string; // e.g. 'API_CALLS', 'GB', 'USERS', 'MINUTES'

  @Column({ type: DataType.DECIMAL(10, 4), allowNull: false })
  public pricePerUnit!: number;

  @Column({ type: DataType.STRING(30), allowNull: false, defaultValue: 'PER_UNIT' })
  public billingModel!: 'PER_UNIT' | 'TIERED' | 'VOLUME' | 'STAIRCASE';

  @Column({ type: DataType.JSONB, allowNull: true })
  public tiers?: Array<{ from: number; to: number; pricePerUnit: number }>;

  @Column({ type: DataType.STRING(20), allowNull: false, defaultValue: 'ACTIVE' })
  public status!: 'ACTIVE' | 'INACTIVE';

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;
}
