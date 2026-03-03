import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import User from '../../user/userModel';
import Employee from '../models/employeeModel';

@Table({ tableName: 'hr_performance_reviews', timestamps: true })
export default class PerformanceReview extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @ForeignKey(() => Employee)
  @Column({ type: DataType.UUID, allowNull: false })
  public employeeId!: string;

  @BelongsTo(() => Employee, { foreignKey: 'employeeId', as: 'employee' })
  public employee?: Employee;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  public reviewerId!: number;

  @BelongsTo(() => User, { foreignKey: 'reviewerId', as: 'reviewer' })
  public reviewer?: User;

  @Column({ type: DataType.STRING(50), allowNull: false })
  public period!: string;

  @Column({ type: DataType.STRING(20), allowNull: false, defaultValue: 'DRAFT' })
  public status!: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'ACKNOWLEDGED';

  @Column({ type: DataType.DECIMAL(3, 1), allowNull: true })
  public overallRating?: number;

  @Column({ type: DataType.JSONB, allowNull: true })
  public ratings?: Record<string, any>;

  @Column({ type: DataType.JSONB, allowNull: true })
  public goals?: Array<{ title: string; status: string; weight: number }>;

  @Column({ type: DataType.TEXT, allowNull: true })
  public comments?: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  public employeeFeedback?: string;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  public reviewDate?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;
}
