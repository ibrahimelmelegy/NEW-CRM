import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import AccountPlan from './accountPlanModel';

@Table({ tableName: 'account_stakeholders', timestamps: true })
export default class Stakeholder extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @ForeignKey(() => AccountPlan)
  @Column({ type: DataType.INTEGER, allowNull: false })
  public accountPlanId!: number;

  @BelongsTo(() => AccountPlan, { foreignKey: 'accountPlanId', as: 'accountPlan' })
  public accountPlan?: AccountPlan;

  @Column({ type: DataType.STRING(200), allowNull: false })
  public name!: string;

  @Column({ type: DataType.STRING(200), allowNull: true })
  public title?: string;

  @Column({ type: DataType.STRING(100), allowNull: true })
  public role?: string; // e.g. 'DECISION_MAKER', 'INFLUENCER', 'CHAMPION', 'BLOCKER', 'END_USER'

  @Column({ type: DataType.INTEGER, allowNull: true })
  public influence?: number; // 1-10

  @Column({ type: DataType.INTEGER, allowNull: true })
  public engagementScore?: number; // 0-100

  @Column({ type: DataType.STRING(200), allowNull: true })
  public email?: string;

  @Column({ type: DataType.STRING(20), allowNull: true })
  public phone?: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  public notes?: string;

  @Column({ type: DataType.STRING(20), allowNull: false, defaultValue: 'NEUTRAL' })
  public sentiment!: 'CHAMPION' | 'SUPPORTER' | 'NEUTRAL' | 'DETRACTOR';

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;
}
