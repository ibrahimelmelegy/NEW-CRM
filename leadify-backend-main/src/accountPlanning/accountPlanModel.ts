import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import Client from '../client/clientModel';
import User from '../user/userModel';

@Table({ tableName: 'account_plans', timestamps: true })
export default class AccountPlan extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @ForeignKey(() => Client)
  @Column({ type: DataType.UUID, allowNull: false })
  public accountId!: string;

  @BelongsTo(() => Client, { foreignKey: 'accountId', as: 'account' })
  public account?: Client;

  @Column({ type: DataType.STRING(200), allowNull: false })
  public name!: string;

  @Column({ type: DataType.JSONB, allowNull: false, defaultValue: [] })
  public goals!: Array<{ title: string; target: string; progress: number; status: string }>;

  @Column({ type: DataType.STRING(20), allowNull: false, defaultValue: 'STANDARD' })
  public tier!: 'ENTERPRISE' | 'STRATEGIC' | 'STANDARD' | 'GROWTH';

  @Column({ type: DataType.INTEGER, allowNull: true })
  public healthScore?: number; // 0-100

  @Column({ type: DataType.DATE, allowNull: true })
  public renewalDate?: Date;

  @Column({ type: DataType.DECIMAL(14, 2), allowNull: true })
  public annualRevenue?: number;

  @Column({ type: DataType.DECIMAL(14, 2), allowNull: true })
  public expansionPotential?: number;

  @Column({ type: DataType.STRING(20), allowNull: false, defaultValue: 'ACTIVE' })
  public status!: 'ACTIVE' | 'IN_REVIEW' | 'COMPLETED' | 'ARCHIVED';

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: true })
  public ownerId?: number;

  @BelongsTo(() => User, { foreignKey: 'ownerId', as: 'owner' })
  public owner?: User;
}
