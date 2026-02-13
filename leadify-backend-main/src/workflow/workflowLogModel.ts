import { Column, DataType, ForeignKey, BelongsTo, Model, Table } from 'sequelize-typescript';
import Workflow from './workflowModel';

@Table({
  tableName: 'workflow_logs',
  modelName: 'WorkflowLog',
  timestamps: true
})
class WorkflowLog extends Model {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4
  })
  public id!: string;

  @ForeignKey(() => Workflow)
  @Column({ type: DataType.UUID, allowNull: false })
  public workflowId!: string;

  @BelongsTo(() => Workflow)
  public workflow!: Workflow;

  @Column({ type: DataType.STRING, allowNull: false })
  public trigger!: string;

  @Column({ type: DataType.UUID, allowNull: true })
  public entityId?: string;

  @Column({ type: DataType.STRING, allowNull: false })
  public status!: string; // SUCCESS | FAILED

  @Column({ type: DataType.TEXT, allowNull: true })
  public details?: string;
}

export default WorkflowLog;
