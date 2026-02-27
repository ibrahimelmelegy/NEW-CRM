import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import Employee from '../models/employeeModel';

@Table({ tableName: 'hr_training_programs', timestamps: true })
export class TrainingProgram extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @Column({ type: DataType.STRING(200), allowNull: false })
  public title!: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  public description?: string;

  @Column({ type: DataType.STRING(20), allowNull: false, defaultValue: 'ONLINE' })
  public type!: 'ONLINE' | 'CLASSROOM' | 'WORKSHOP' | 'CERTIFICATION' | 'ON_THE_JOB';

  @Column({ type: DataType.STRING(20), allowNull: false, defaultValue: 'ACTIVE' })
  public status!: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';

  @Column({ type: DataType.STRING(100), allowNull: true })
  public category?: string;

  @Column({ type: DataType.INTEGER, allowNull: true })
  public durationHours?: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: true })
  public cost?: number;

  @Column({ type: DataType.STRING, allowNull: true })
  public instructor?: string;

  @Column({ type: DataType.INTEGER, allowNull: true })
  public maxParticipants?: number;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  public startDate?: string;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  public endDate?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;
}

@Table({ tableName: 'hr_training_enrollments', timestamps: true })
export class TrainingEnrollment extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @ForeignKey(() => TrainingProgram)
  @Column({ type: DataType.INTEGER, allowNull: false })
  public programId!: number;

  @BelongsTo(() => TrainingProgram, { foreignKey: 'programId', as: 'program' })
  public program?: TrainingProgram;

  @ForeignKey(() => Employee)
  @Column({ type: DataType.INTEGER, allowNull: false })
  public employeeId!: number;

  @BelongsTo(() => Employee, { foreignKey: 'employeeId', as: 'employee' })
  public employee?: Employee;

  @Column({ type: DataType.STRING(20), allowNull: false, defaultValue: 'ENROLLED' })
  public status!: 'ENROLLED' | 'IN_PROGRESS' | 'COMPLETED' | 'DROPPED' | 'FAILED';

  @Column({ type: DataType.INTEGER, allowNull: true })
  public progress?: number;

  @Column({ type: DataType.DECIMAL(5, 2), allowNull: true })
  public score?: number;

  @Column({ type: DataType.DATE, allowNull: true })
  public completedAt?: Date;

  @Column({ type: DataType.TEXT, allowNull: true })
  public feedback?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;
}
