import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import User from '../user/userModel';

@Table({ tableName: 'sales_competitors', timestamps: true })
export default class Competitor extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @Column({ type: DataType.STRING(200), allowNull: false })
  public name!: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public website?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public industry?: string;

  @Column({ type: DataType.STRING(20), allowNull: true })
  public size?: 'SMALL' | 'MEDIUM' | 'LARGE' | 'ENTERPRISE';

  @Column({ type: DataType.TEXT, allowNull: true })
  public strengths?: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  public weaknesses?: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  public notes?: string;

  @Column({ type: DataType.STRING(20), allowNull: false, defaultValue: 'ACTIVE' })
  public status!: 'ACTIVE' | 'INACTIVE' | 'ACQUIRED';

  @Column({ type: DataType.STRING(20), allowNull: true })
  public threatLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  @Column({ type: DataType.JSONB, allowNull: true })
  public products?: Array<{ name: string; description?: string; price?: number }>;

  @Column({ type: DataType.FLOAT, allowNull: true })
  public marketShare?: number;

  @Column({ type: DataType.INTEGER, allowNull: true, validate: { min: 1, max: 5 } })
  public rating?: number;

  @Column({ type: DataType.INTEGER, allowNull: true, defaultValue: 0 })
  public dealsWon?: number;

  @Column({ type: DataType.INTEGER, allowNull: true, defaultValue: 0 })
  public dealsLost?: number;

  @Column({ type: DataType.STRING(50), allowNull: true })
  public pricingModel?: 'SUBSCRIPTION' | 'ONE_TIME' | 'FREEMIUM' | 'USAGE_BASED' | 'ENTERPRISE';

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: true })
  public basePrice?: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: true })
  public enterprisePrice?: number;

  @Column({ type: DataType.TEXT, allowNull: true })
  public pricingNotes?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: true })
  public createdBy?: number;

  @BelongsTo(() => User, { foreignKey: 'createdBy', as: 'creator' })
  public creator?: User;
}
