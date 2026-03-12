import { AllowNull, BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import WorkflowRule from './workflowModel';

// ── Per-action result stored in actionsExecuted JSONB ──
export interface ActionExecutionResult {
  actionType: string;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  result?: unknown;
  error?: string;
}

export enum ExecutionStatus {
  SUCCESS = 'SUCCESS',
  PARTIAL = 'PARTIAL',
  FAILED = 'FAILED'
}

@Table({
  tableName: 'workflow_executions',
  modelName: 'WorkflowExecution',
  timestamps: true,
  updatedAt: false, // immutable log – only createdAt
  indexes: [{ fields: ['workflowRuleId'] }, { fields: ['entityType', 'entityId'] }, { fields: ['status'] }, { fields: ['createdAt'] }]
})
class WorkflowExecution extends Model {
  @Column({
    primaryKey: true,
    type: DataType.INTEGER,
    autoIncrement: true
  })
  public id!: number;

  @ForeignKey(() => WorkflowRule)
  @Column({ type: DataType.INTEGER, allowNull: false })
  public workflowRuleId!: number;

  @BelongsTo(() => WorkflowRule, { as: 'workflowRule' })
  public workflowRule?: WorkflowRule;

  @Column({ type: DataType.STRING, allowNull: false })
  public entityType!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  public entityId!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  public triggerType!: string;

  @Column({
    type: DataType.ENUM(...Object.values(ExecutionStatus)),
    allowNull: false
  })
  public status!: ExecutionStatus;

  @AllowNull(true)
  @Column({ type: DataType.JSONB })
  public actionsExecuted?: ActionExecutionResult[];

  @AllowNull(true)
  @Column({ type: DataType.INTEGER })
  public executionTimeMs?: number;

  @AllowNull(true)
  @Column({ type: DataType.INTEGER })
  public userId?: number;
}

export default WorkflowExecution;
