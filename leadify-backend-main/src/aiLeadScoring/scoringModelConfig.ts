import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import User from '../user/userModel';

@Table({ tableName: 'scoring_model_configs', timestamps: true })
export default class ScoringModelConfig extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @Column({ type: DataType.STRING(200), allowNull: false })
  public name!: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  public description?: string;

  @Column({ type: DataType.STRING(30), allowNull: false, defaultValue: 'RULE_BASED' })
  public type!: 'RULE_BASED' | 'LOGISTIC_REGRESSION' | 'DECISION_TREE' | 'ENSEMBLE';

  @Column({ type: DataType.FLOAT, allowNull: true })
  public accuracy?: number; // 0-1

  @Column({ type: DataType.STRING(20), allowNull: false, defaultValue: 'DRAFT' })
  public status!: 'DRAFT' | 'ACTIVE' | 'TESTING' | 'RETIRED';

  @Column({ type: DataType.JSONB, allowNull: false, defaultValue: [] })
  public parameters!: Array<{
    feature: string;
    weight: number;
    condition: string;
    value?: unknown;
    points: number;
  }>;

  @Column({ type: DataType.JSONB, allowNull: true })
  public featureImportance?: Record<string, number>;

  @Column({ type: DataType.INTEGER, allowNull: true, defaultValue: 0 })
  public leadsScored?: number;

  @Column({ type: DataType.DATE, allowNull: true })
  public lastTrainedAt?: Date;

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: true })
  public createdBy?: number;

  @BelongsTo(() => User, { foreignKey: 'createdBy', as: 'creator' })
  public creator?: User;
}
