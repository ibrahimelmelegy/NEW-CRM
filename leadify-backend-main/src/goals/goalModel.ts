import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({ tableName: 'goals', timestamps: true })
export default class Goal extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @Column({ type: DataType.STRING(255), allowNull: false })
  public title!: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  public description?: string;

  @Column({ type: DataType.STRING(20), allowNull: false, defaultValue: 'PERSONAL' })
  public level!: 'COMPANY' | 'TEAM' | 'PERSONAL';

  @Column({ type: DataType.STRING(20), allowNull: false, defaultValue: 'NOT_STARTED' })
  public status!: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  public progress!: number;

  @Column({ type: DataType.STRING(100), allowNull: true })
  public owner?: string;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  public dueDate?: string;

  @Column({ type: DataType.JSONB, allowNull: true })
  public keyResults?: Array<{ id: number; title: string; completed: boolean }>;

  @Column({ type: DataType.INTEGER, allowNull: true })
  public parentGoalId?: number;

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;
}
