import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript';
import Department from '../models/departmentModel';

@Table({ tableName: 'hr_job_postings', timestamps: true })
export class JobPosting extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @Column({ type: DataType.STRING(200), allowNull: false })
  public title!: string;

  @ForeignKey(() => Department)
  @Column({ type: DataType.UUID, allowNull: true })
  public departmentId?: string;

  @BelongsTo(() => Department, { foreignKey: 'departmentId', as: 'department' })
  public department?: Department;

  @Column({ type: DataType.STRING(20), allowNull: false, defaultValue: 'OPEN' })
  public status!: 'DRAFT' | 'OPEN' | 'CLOSED' | 'ON_HOLD' | 'FILLED';

  @Column({ type: DataType.STRING(20), allowNull: false, defaultValue: 'FULL_TIME' })
  public type!: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';

  @Column({ type: DataType.STRING, allowNull: true })
  public location?: string;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: true })
  public salaryMin?: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: true })
  public salaryMax?: number;

  @Column({ type: DataType.TEXT, allowNull: true })
  public description?: string;

  @Column({ type: DataType.JSONB, allowNull: true })
  public requirements?: string[];

  @Column({ type: DataType.INTEGER, allowNull: true, defaultValue: 1 })
  public openPositions?: number;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  public closingDate?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;

  @HasMany(() => Applicant, { foreignKey: 'jobPostingId', as: 'applicants' })
  public applicants?: Applicant[];
}

@Table({ tableName: 'hr_applicants', timestamps: true })
export class Applicant extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @ForeignKey(() => JobPosting)
  @Column({ type: DataType.INTEGER, allowNull: false })
  public jobPostingId!: number;

  @BelongsTo(() => JobPosting, { foreignKey: 'jobPostingId', as: 'jobPosting' })
  public jobPosting?: JobPosting;

  @Column({ type: DataType.STRING(100), allowNull: false })
  public name!: string;

  @Column({ type: DataType.STRING(100), allowNull: false })
  public email!: string;

  @Column({ type: DataType.STRING(20), allowNull: true })
  public phone?: string;

  @Column({ type: DataType.STRING(20), allowNull: false, defaultValue: 'APPLIED' })
  public stage!: 'APPLIED' | 'SCREENING' | 'INTERVIEW' | 'ASSESSMENT' | 'OFFER' | 'HIRED' | 'REJECTED';

  @Column({ type: DataType.STRING, allowNull: true })
  public resumeUrl?: string;

  @Column({ type: DataType.INTEGER, allowNull: true })
  public rating?: number;

  @Column({ type: DataType.TEXT, allowNull: true })
  public notes?: string;

  @Column({ type: DataType.JSONB, allowNull: true })
  public experience?: Record<string, unknown>;

  @Column({ type: DataType.STRING, allowNull: true })
  public source?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;
}
