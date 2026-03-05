import { BelongsTo, Column, DataType, Default, ForeignKey, Model, Table } from 'sequelize-typescript';
import User from '../user/userModel';

// --- Scoring criteria JSONB shape ---
export interface ScoringCriterion {
  field: string;
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'contains' | 'is_empty' | 'is_not_empty' | 'greater_than' | 'less_than' | 'between';
  value: any;
  points: number;
}

// --- Grade enum ---
export enum ScoreGrade {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
  F = 'F'
}

// --- Lead Scoring Rule ---
@Table({
  tableName: 'lead_scoring_rules',
  modelName: 'LeadScoringRule',
  timestamps: true,
  indexes: [{ fields: ['entityType'] }, { fields: ['isActive'] }]
})
class LeadScoringRule extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @Column({ type: DataType.STRING, allowNull: false })
  public name!: string;

  @Default('lead')
  @Column({ type: DataType.STRING, allowNull: false })
  public entityType!: string;

  @Column({ type: DataType.JSONB, allowNull: false })
  public criteria!: ScoringCriterion[];

  @Default(true)
  @Column({ type: DataType.BOOLEAN, allowNull: false })
  public isActive!: boolean;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  public createdBy!: number;

  @BelongsTo(() => User, { foreignKey: 'createdBy', as: 'creator' })
  public creator!: User;
}

// --- Entity Score ---
@Table({
  tableName: 'entity_scores',
  modelName: 'EntityScore',
  timestamps: true,
  indexes: [{ unique: true, fields: ['entityType', 'entityId'] }, { fields: ['score'] }, { fields: ['grade'] }]
})
class EntityScore extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @Column({ type: DataType.STRING, allowNull: false })
  public entityType!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  public entityId!: string;

  @Default(0)
  @Column({ type: DataType.INTEGER, allowNull: false })
  public score!: number;

  @Column({ type: DataType.ENUM(...Object.values(ScoreGrade)), allowNull: true })
  public grade!: string;

  @Column({ type: DataType.JSONB, allowNull: true })
  public breakdown!: Array<{ ruleId: number; ruleName: string; points: number; matchedCriteria: string[] }>;

  @Column({ type: DataType.DATE, allowNull: true })
  public calculatedAt!: Date;
}

export { LeadScoringRule, EntityScore };
