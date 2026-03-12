import { AllowNull, BelongsTo, Column, DataType, Default, ForeignKey, Model, Table } from 'sequelize-typescript';
import User from '../user/userModel';

// ── Condition object stored in the conditions JSONB column ──
export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty' | 'in' | 'not_in';
  value: any;
}

// ── Action object types stored in the actions JSONB column ──
export type WorkflowAction =
  | { type: 'UPDATE_FIELD'; field: string; value: string }
  | { type: 'CREATE_RECORD'; entityType: string; data: Record<string, unknown> }
  | { type: 'SEND_EMAIL'; templateId?: string; to: string; subject: string; body: string }
  | { type: 'SEND_NOTIFICATION'; userId?: string; role?: string; title: string; message: string }
  | { type: 'CREATE_TASK'; title: string; assignedTo: string; dueInDays: number }
  | { type: 'WEBHOOK'; url: string; method: string; headers: Record<string, string>; body: Record<string, unknown> }
  | { type: 'ASSIGN_TO'; userId?: string; method?: 'round_robin' | 'least_loaded' }
  | { type: 'DELAY'; days?: number; hours?: number };

// ── Enums ──
export enum TriggerType {
  ON_CREATE = 'ON_CREATE',
  ON_UPDATE = 'ON_UPDATE',
  ON_DELETE = 'ON_DELETE',
  ON_FIELD_CHANGE = 'ON_FIELD_CHANGE',
  SCHEDULED = 'SCHEDULED',
  MANUAL = 'MANUAL'
}

export enum ConditionLogic {
  AND = 'AND',
  OR = 'OR'
}

export const ENTITY_TYPES = ['lead', 'deal', 'client', 'opportunity', 'invoice', 'contract', 'purchaseOrder', 'ticket', 'expense', 'task'] as const;

export type EntityType = (typeof ENTITY_TYPES)[number];

@Table({
  tableName: 'workflow_rules',
  modelName: 'WorkflowRule',
  timestamps: true,
  indexes: [{ fields: ['entityType'] }, { fields: ['triggerType'] }, { fields: ['isActive'] }, { fields: ['entityType', 'triggerType', 'isActive'] }]
})
class WorkflowRule extends Model {
  @Column({
    primaryKey: true,
    type: DataType.INTEGER,
    autoIncrement: true
  })
  public id!: number;

  @Column({ type: DataType.STRING, allowNull: false })
  public name!: string;

  @AllowNull(true)
  @Column({ type: DataType.TEXT })
  public description?: string;

  @Column({ type: DataType.STRING, allowNull: false })
  public entityType!: string;

  @Column({
    type: DataType.ENUM(...Object.values(TriggerType)),
    allowNull: false
  })
  public triggerType!: TriggerType;

  @AllowNull(true)
  @Column({ type: DataType.STRING })
  public triggerField?: string;

  @AllowNull(true)
  @Column({ type: DataType.STRING })
  public triggerValue?: string;

  @AllowNull(true)
  @Column({ type: DataType.JSONB })
  public conditions?: WorkflowCondition[];

  @Default(ConditionLogic.AND)
  @Column({
    type: DataType.ENUM(...Object.values(ConditionLogic)),
    allowNull: false
  })
  public conditionLogic!: ConditionLogic;

  @Column({ type: DataType.JSONB, allowNull: false })
  public actions!: WorkflowAction[];

  @Default(true)
  @Column({ type: DataType.BOOLEAN, allowNull: false })
  public isActive!: boolean;

  @Default(0)
  @Column({ type: DataType.INTEGER, allowNull: false })
  public priority!: number;

  @Default(0)
  @Column({ type: DataType.INTEGER, allowNull: false })
  public executionCount!: number;

  @AllowNull(true)
  @Column({ type: DataType.DATE })
  public lastExecutedAt?: Date;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: true })
  public createdBy?: number;

  @BelongsTo(() => User, { as: 'creator' })
  public creator?: User;

  @AllowNull(true)
  @Column({ type: DataType.JSONB })
  public graphData?: Record<string, unknown>;

  // Virtual association – defined in execution model
  public executions?: any[];
}

export default WorkflowRule;
