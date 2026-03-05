import { Table, Column, Model, DataType, HasMany, ForeignKey } from 'sequelize-typescript';

@Table({ tableName: 'mkt_surveys', timestamps: true })
export class Survey extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @Column({ type: DataType.STRING(200), allowNull: false })
  public title!: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  public description?: string;

  @Column({ type: DataType.STRING(30), allowNull: false, defaultValue: 'CUSTOM' })
  public type!: 'CUSTOMER_SATISFACTION' | 'EMPLOYEE' | 'NPS' | 'PRODUCT_FEEDBACK' | 'CUSTOM';

  @Column({ type: DataType.STRING(20), allowNull: false, defaultValue: 'DRAFT' })
  public status!: 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED';

  @Column({ type: DataType.JSONB, allowNull: true })
  public questions?: Array<{ id: string; type: string; text: string; options?: string[]; required: boolean }>;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  public responseCount!: number;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  public startDate?: string;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  public endDate?: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  public isAnonymous!: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  public allowMultipleResponses!: boolean;

  @Column({ type: DataType.INTEGER, allowNull: true })
  public createdBy?: number;

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;

  @HasMany(() => SurveyResponse, { foreignKey: 'surveyId', as: 'responses' })
  public responses?: SurveyResponse[];
}

@Table({ tableName: 'mkt_survey_responses', timestamps: true })
export class SurveyResponse extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @ForeignKey(() => Survey)
  @Column({ type: DataType.INTEGER, allowNull: false })
  public surveyId!: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  public respondentId?: number;

  @Column({ type: DataType.STRING, allowNull: true })
  public respondentEmail?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public respondentName?: string;

  @Column({ type: DataType.JSONB, allowNull: false })
  public answers!: Record<string, any>;

  @Column({ type: DataType.DATE, allowNull: true })
  public completedAt?: Date;

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;
}
