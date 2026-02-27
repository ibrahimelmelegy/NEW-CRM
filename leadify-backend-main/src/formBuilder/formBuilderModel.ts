import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';

@Table({ tableName: 'mkt_form_templates', timestamps: true })
export class FormTemplate extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @Column({ type: DataType.STRING(200), allowNull: false })
  public name!: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  public description?: string;

  @Column({ type: DataType.STRING(20), allowNull: false, defaultValue: 'ACTIVE' })
  public status!: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

  @Column({ type: DataType.JSONB, allowNull: true })
  public fields?: Array<{ name: string; type: string; label: string; required: boolean; options?: string[] }>;

  @Column({ type: DataType.JSONB, allowNull: true })
  public settings?: Record<string, any>;

  @Column({ type: DataType.STRING, allowNull: true })
  public thankYouMessage?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public redirectUrl?: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  public createLead!: boolean;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  public submissionCount!: number;

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;

  @HasMany(() => FormSubmission, { foreignKey: 'formId', as: 'submissions' })
  public submissions?: FormSubmission[];
}

@Table({ tableName: 'mkt_form_submissions', timestamps: true })
export class FormSubmission extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  public formId!: number;

  @Column({ type: DataType.JSONB, allowNull: false })
  public data!: Record<string, any>;

  @Column({ type: DataType.STRING, allowNull: true })
  public source?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public ipAddress?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public leadId?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;
}
